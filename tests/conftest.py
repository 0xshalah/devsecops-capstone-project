"""Shared fixtures for the Phase 4 suite.

Default mode runs the FastAPI app in-process through httpx.ASGITransport against the MongoDB in MONGO_URL/DB_NAME.
Set TEST_BASE_URL to run the same suite against a deployed backend that shares that database.
"""
import os
import sys
from pathlib import Path

import httpx
import pytest
import pytest_asyncio
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
load_dotenv(BACKEND_DIR / ".env")
sys.path.extend([str(BACKEND_DIR), str(BACKEND_DIR.parent)])

from database.init_db import init_db  # noqa: E402
from database.seed import seed_database  # noqa: E402
from db import db  # noqa: E402
from server import app  # noqa: E402
from tests.helpers import STRONG_PASSWORD, bearer, unique_email  # noqa: E402


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
