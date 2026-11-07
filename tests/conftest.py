"""Shared fixtures for the Phase 4 suite.

Default mode runs the FastAPI app in-process through httpx.ASGITransport against a dedicated test database
(TEST_DB_NAME, default "<DB_NAME>_pytest") that is dropped at the start of every run, so app data is never touched.
Set TEST_BASE_URL to run the same suite against a deployed backend; that mode must share the backend's DB_NAME.
"""
import asyncio
import os
import sys
from pathlib import Path

import httpx
import pytest
import pytest_asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
load_dotenv(BACKEND_DIR / ".env")
sys.path.extend([str(BACKEND_DIR), str(BACKEND_DIR.parent)])

REMOTE = bool(os.environ.get("TEST_BASE_URL", "").strip())
if not REMOTE:
    APP_DB = os.environ.setdefault("APP_DB_NAME", os.environ["DB_NAME"])  # xdist workers inherit the original name
    os.environ["DB_NAME"] = os.environ.get("TEST_DB_NAME") or f"{APP_DB}_pytest"
    if os.environ["DB_NAME"] == APP_DB:
        raise RuntimeError("TEST_DB_NAME must differ from DB_NAME so tests never write to application data")

from database.init_db import init_db  # noqa: E402
from database.seed import seed_database  # noqa: E402
from db import db  # noqa: E402
from server import app  # noqa: E402
from tests.helpers import STRONG_PASSWORD, bearer, unique_email  # noqa: E402


def pytest_sessionstart(session):
    # Controller only (not xdist workers): start from a freshly seeded test database, or clear stale counters remotely.
    if hasattr(session.config, "workerinput"):
        return
    from pymongo import MongoClient
    with MongoClient(os.environ["MONGO_URL"]) as mongo:
        if REMOTE:
            mongo[os.environ["DB_NAME"]].rate_limits.delete_many({})
            return
        mongo.drop_database(os.environ["DB_NAME"])
    asyncio.run(_prepare_test_db())


async def _prepare_test_db():
    # Seeding once here avoids xdist workers racing to insert the same demo account.
    mongo = AsyncIOMotorClient(os.environ["MONGO_URL"], tz_aware=True)
    try:
        await init_db(mongo[os.environ["DB_NAME"]])
        await seed_database(mongo[os.environ["DB_NAME"]])
    finally:
        mongo.close()



@pytest_asyncio.fixture(scope="session")
async def client():
    base_url = os.environ.get("TEST_BASE_URL", "").rstrip("/")
    if base_url:
        async with httpx.AsyncClient(base_url=base_url, timeout=30) as c:
            yield c
        return
    await init_db(db)
    await seed_database(db)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver", timeout=30) as c:
        yield c


@pytest.fixture
def signup(client):
    """Creates a fresh Owner account with its own workspace."""
    async def _signup(tag: str = "user") -> dict:
        email = unique_email(tag)
        r = await client.post("/api/auth/signup", json={"name": f"Pytest {tag}", "email": email, "password": STRONG_PASSWORD})
        assert r.status_code == 201, r.text
        data = r.json()
        return {"email": email, "token": data["token"], "headers": bearer(data["token"]), "user": data["user"],
                "workspace": data["workspace"]}

    return _signup


@pytest.fixture
def make_role(signup):
    """Creates an account and demotes it to the given role (there is no member-invite API yet)."""
    async def _make(role: str) -> dict:
        account = await signup(role.lower())
        uid, ws_id = account["user"]["id"], account["workspace"]["id"]
        await db.users.update_one({"id": uid}, {"$set": {"role": role}})
        await db.workspaces.update_one({"id": ws_id, "members.user_id": uid}, {"$set": {"members.$.role": role}})
        return account

    return _make


@pytest.fixture
def create_key(client):
    async def _create(headers: dict, **overrides) -> dict:
        body = {"name": "pytest-key", "env": "test", "scopes": ["chat:write"], "rateLimit": 600, **overrides}
        r = await client.post("/api/keys", json=body, headers=headers)
        assert r.status_code == 201, r.text
        return r.json()

    return _create


@pytest.fixture
def mongo():
    return db
