"""Auth: signup, signin, generic + timing-safe failures, lockout, JWT validation, profile BOPLA."""
import os
import statistics
import time
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from tests.helpers import STRONG_PASSWORD, bearer, unique_email

INVALID = "Invalid email or password"


def _claims(user: dict, **overrides) -> dict:
    now = datetime.now(timezone.utc)
    base = {"sub": user["id"], "ws": user["workspaceId"], "role": user["role"], "type": "access",
            "iat": now, "exp": now + timedelta(minutes=5)}
    return {**base, **overrides}


async def _signin(client, email, password):
    return await client.post("/api/auth/signin", json={"email": email, "password": password})


# ---------- Sign up ----------
async def test_signup_creates_owner_and_workspace(client, mongo):
    email = unique_email("signup")
    r = await client.post("/api/auth/signup", json={"name": "Alice", "email": email, "password": STRONG_PASSWORD})
    assert r.status_code == 201, r.text
    data = r.json()
    user, ws = data["user"], data["workspace"]
    assert data["tokenType"] == "bearer" and data["expiresIn"] > 0
    assert user["id"].startswith("usr_") and ws["id"].startswith("ws_")
    assert user["role"] == "Owner" and ws["role"] == "Owner"
    assert ws["ownerId"] == user["id"] and user["workspaceId"] == ws["id"]
    assert "password_hash" not in user and "passwordHash" not in user

    stored = await mongo.users.find_one({"email": email}, {"_id": 0})
    assert stored["password_hash"].startswith("$2b$")
    assert STRONG_PASSWORD not in str(stored)


async def test_signup_duplicate_email_409(client, signup):
    account = await signup("dup")
    r = await client.post("/api/auth/signup", json={"name": "Dup", "email": account["email"], "password": STRONG_PASSWORD})
    assert r.status_code == 409


@pytest.mark.parametrize("body", [
    {"name": "X", "password": "short"},
    {"name": "X", "password": STRONG_PASSWORD, "role": "Owner"},
    {"name": "X", "password": STRONG_PASSWORD, "plan": "Enterprise"},
])
async def test_signup_rejects_invalid_or_privileged_payload(client, body):
    r = await client.post("/api/auth/signup", json={**body, "email": unique_email("bad")})
    assert r.status_code == 422


# ---------- Sign in ----------
async def test_signin_issues_signed_jwt_with_expected_claims(client, signup):
    account = await signup("signin")
    r = await _signin(client, account["email"], STRONG_PASSWORD)
    assert r.status_code == 200, r.text
    claims = jwt.decode(r.json()["token"], os.environ["JWT_SECRET"], algorithms=["HS256"])
    assert claims["sub"] == account["user"]["id"]
    assert claims["ws"] == account["workspace"]["id"]
    assert claims["role"] == "Owner"
    assert claims["exp"] > claims["iat"]


async def test_signin_email_is_case_insensitive(client, signup):
    account = await signup("case")
    r = await _signin(client, account["email"].upper(), STRONG_PASSWORD)
    assert r.status_code == 200


async def test_wrong_password_and_unknown_email_are_indistinguishable(client, signup):
    account = await signup("enum")
    wrong = await _signin(client, account["email"], "definitely-wrong")
    unknown = await _signin(client, unique_email("ghost"), "definitely-wrong")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json() == {"detail": INVALID}


async def test_signin_timing_is_constant_for_unknown_emails(client, signup):
    """Unknown emails still pay for a bcrypt check, so timing cannot reveal which accounts exist."""
    account = await signup("timing")
    unknown_email = unique_email("timing-ghost")

    async def timed(email):
        started = time.perf_counter()
        r = await _signin(client, email, "definitely-wrong")
        assert r.status_code == 401
        return time.perf_counter() - started

    wrong = [await timed(account["email"]) for _ in range(3)]
    unknown = [await timed(unknown_email) for _ in range(3)]
    assert statistics.median(unknown) >= 0.5 * statistics.median(wrong)


async def test_signin_lockout_after_five_failures(client, signup):
    account = await signup("lockout")
    statuses = [(await _signin(client, account["email"], "bad-password")).status_code for _ in range(6)]
    assert statuses[:5] == [401] * 5
    assert statuses[5] == 429
    # Correct password is refused while locked out.
    assert (await _signin(client, account["email"], STRONG_PASSWORD)).status_code == 429


# ---------- JWT validation ----------
async def test_me_requires_token(client):
    assert (await client.get("/api/auth/me")).status_code == 401


async def test_me_with_valid_token(client, signup):
    account = await signup("me")
    r = await client.get("/api/auth/me", headers=account["headers"])
    assert r.status_code == 200
    assert r.json()["user"]["id"] == account["user"]["id"]
    assert r.json()["workspace"]["id"] == account["workspace"]["id"]


async def test_jwt_validation_rejects_forged_and_malformed_tokens(client, signup):
    account = await signup("jwt")
    user = account["user"]
    secret = os.environ["JWT_SECRET"]
    forged = {
        "garbage": "abc.def.ghi",
        "wrong_signature": jwt.encode(_claims(user), "not-the-real-secret-0123456789abcdef", algorithm="HS256"),
        "alg_none": jwt.encode(_claims(user), "", algorithm="none"),
        "expired": jwt.encode(_claims(user, iat=datetime.now(timezone.utc) - timedelta(hours=2),
                                      exp=datetime.now(timezone.utc) - timedelta(hours=1)), secret, algorithm="HS256"),
        "unknown_user": jwt.encode(_claims(user, sub="usr_doesnotexist"), secret, algorithm="HS256"),
        "workspace_mismatch": jwt.encode(_claims(user, ws="ws_someoneelse"), secret, algorithm="HS256"),
        "missing_claims": jwt.encode({"sub": user["id"], "type": "access"}, secret, algorithm="HS256"),
        "wrong_type": jwt.encode(_claims(user, type="refresh"), secret, algorithm="HS256"),
        "api_key_as_jwt": "sk-gw-live-0123456789abcdef0123456789abcdef",
    }
    for name, token in forged.items():
        r = await client.get("/api/auth/me", headers=bearer(token))
        assert r.status_code == 401, f"{name} accepted: {r.status_code}"


async def test_expired_token_reports_session_expired(client, signup):
    account = await signup("expired")
    past = datetime.now(timezone.utc) - timedelta(hours=1)
    token = jwt.encode(_claims(account["user"], iat=past - timedelta(hours=1), exp=past), os.environ["JWT_SECRET"],
                       algorithm="HS256")
    r = await client.get("/api/auth/me", headers=bearer(token))
    assert r.status_code == 401
    assert r.json()["detail"] == "Session expired"


# ---------- Profile ----------
async def test_profile_update_allowed_fields(client, signup):
    account = await signup("profile")
    body = {"name": "Renamed", "company": "Acme", "jobTitle": "SRE", "timezone": "Asia/Jakarta", "bio": "hello"}
    r = await client.put("/api/auth/profile", json=body, headers=account["headers"])
    assert r.status_code == 200, r.text
    me = (await client.get("/api/auth/me", headers=account["headers"])).json()["user"]
    assert {k: me[k] for k in body} == body


@pytest.mark.parametrize("field,value", [
    ("role", "Owner"), ("plan", "Enterprise"), ("emailVerified", True),
    ("workspace_id", "ws_hijacked"), ("password_hash", "deadbeef"), ("email", "new@example.com"),
])
async def test_profile_rejects_privileged_fields(client, signup, field, value):
    account = await signup("bopla")
    r = await client.put("/api/auth/profile", json={field: value}, headers=account["headers"])
    assert r.status_code == 422
