"""Phase 1 backend tests: auth signup/signin/me/profile, workspace BOLA, health, CORS."""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://devsecops-capstone--1tvkdwfj.preview.emergentagent.com"
API = f"{BASE_URL}/api"
DEMO_EMAIL = "demo@tollgate.dev"
DEMO_PASSWORD = "TollgateDemo!2026"
ALLOWED_ORIGIN = "https://devsecops-capstone--1tvkdwfj.preview.emergentagent.com"


def _email(tag="user"):
    return f"test+{tag}_{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
def test_health_operational(session):
    r = session.get(f"{API}/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "operational"
    assert data["checks"]["database"] == "ok"


# ---------- Signup ----------
def test_signup_returns_201_with_token_user_workspace(session):
    payload = {"name": "Alice Test", "email": _email("signup"), "password": "StrongPass!2026"}
    r = session.post(f"{API}/auth/signup", json=payload)
    assert r.status_code == 201, r.text
    data = r.json()
    assert isinstance(data.get("token"), str) and len(data["token"]) > 20
    assert data["tokenType"] == "bearer"
    assert data["expiresIn"] > 0

    user = data["user"]
    assert user["id"].startswith("usr_")
    assert user["email"] == payload["email"].lower()
    assert user["role"] == "Owner"
    assert user["plan"] in ("Free", "Pro", "Enterprise")
    assert "password_hash" not in user and "passwordHash" not in user

    ws = data["workspace"]
    assert ws["id"].startswith("ws_")
    assert ws["role"] == "Owner"
    assert ws["ownerId"] == user["id"]
    assert user["workspaceId"] == ws["id"]


def test_signup_duplicate_email_returns_409(session):
    email = _email("dup")
    body = {"name": "Dup", "email": email, "password": "StrongPass!2026"}
    r1 = session.post(f"{API}/auth/signup", json=body)
    assert r1.status_code == 201
    r2 = session.post(f"{API}/auth/signup", json=body)
    assert r2.status_code == 409


def test_signup_rejects_extra_fields(session):
    body = {"name": "X", "email": _email("extra"), "password": "StrongPass!2026", "role": "Admin"}
    r = session.post(f"{API}/auth/signup", json=body)
    assert r.status_code == 422


# ---------- Signin ----------
def test_signin_demo_user_returns_jwt(session):
    r = session.post(f"{API}/auth/signin", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["token"]
    assert data["user"]["email"] == DEMO_EMAIL
    assert data["user"]["role"] == "Owner"


def test_signin_wrong_password_generic_401(session):
    r = session.post(f"{API}/auth/signin", json={"email": DEMO_EMAIL, "password": "wrong-pass-xyz"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"


def test_signin_unknown_email_identical_401(session):
    r = session.post(f"{API}/auth/signin", json={"email": _email("ghost"), "password": "whatever123"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"


def test_signin_lockout_after_5_failures(session):
    throwaway = _email("lockout")  # unknown email -> 401 each attempt, same identifier (ip+email)
    last_status = None
    for i in range(6):
        r = session.post(f"{API}/auth/signin", json={"email": throwaway, "password": "bad-pass-xyz"})
        last_status = r.status_code
        if r.status_code == 429:
            break
    assert last_status == 429, f"Expected 429 after 5 failures, got {last_status}"


# ---------- /me ----------
@pytest.fixture(scope="module")
def demo_token(session):
    r = session.post(f"{API}/auth/signin", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200
    return r.json()["token"]


def test_me_requires_bearer(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_with_tampered_token(session):
    r = session.get(f"{API}/auth/me", headers={"Authorization": "Bearer abc.def.ghi"})
    assert r.status_code == 401


def test_me_rejects_api_key_prefixed_token(session):
    r = session.get(f"{API}/auth/me", headers={"Authorization": "Bearer sk-gw-live-fakekey1234"})
    assert r.status_code == 401


def test_me_success(session, demo_token):
    r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {demo_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["user"]["email"] == DEMO_EMAIL
    assert data["workspace"]["id"].startswith("ws_")


# ---------- Profile update ----------
def test_profile_update_allowed_fields(session, demo_token):
    headers = {"Authorization": f"Bearer {demo_token}"}
    new_name = f"Demo Operator {uuid.uuid4().hex[:4]}"
    r = session.put(f"{API}/auth/profile", json={"name": new_name, "company": "Acme", "jobTitle": "SRE",
                                                  "timezone": "UTC", "bio": "hello"}, headers=headers)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["name"] == new_name
    assert data["user"]["company"] == "Acme"
    # verify persistence
    r2 = session.get(f"{API}/auth/me", headers=headers)
    assert r2.json()["user"]["name"] == new_name


@pytest.mark.parametrize("bad_field,value", [
    ("role", "Admin"),
    ("plan", "Enterprise"),
    ("emailVerified", True),
    ("workspace_id", "ws_hacked"),
    ("password_hash", "deadbeef"),
])
def test_profile_rejects_privileged_fields(session, demo_token, bad_field, value):
    headers = {"Authorization": f"Bearer {demo_token}"}
    r = session.put(f"{API}/auth/profile", json={bad_field: value}, headers=headers)
    assert r.status_code == 422, f"{bad_field} should be rejected, got {r.status_code}: {r.text}"


# ---------- Workspaces (BOLA) ----------
def test_get_own_workspace(session, demo_token):
    headers = {"Authorization": f"Bearer {demo_token}"}
    me = session.get(f"{API}/auth/me", headers=headers).json()
    ws_id = me["workspace"]["id"]
    r = session.get(f"{API}/workspaces/{ws_id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["id"] == ws_id


def test_get_other_workspace_returns_404(session, demo_token):
    """Create a 2nd user and try to access their workspace with demo token."""
    other_body = {"name": "Bob", "email": _email("bola"), "password": "StrongPass!2026"}
    r = session.post(f"{API}/auth/signup", json=other_body)
    assert r.status_code == 201
    other_ws = r.json()["workspace"]["id"]

    headers = {"Authorization": f"Bearer {demo_token}"}
    r = session.get(f"{API}/workspaces/{other_ws}", headers=headers)
    assert r.status_code == 404


# ---------- CORS ----------
def test_cors_allows_preview_origin(session):
    r = session.options(f"{API}/auth/signin", headers={
        "Origin": ALLOWED_ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert r.status_code in (200, 204)
    assert r.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN


def test_cors_rejects_unknown_origin(session):
    r = session.options(f"{API}/auth/signin", headers={
        "Origin": "https://evil.example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    # Either rejected with 400 or allow-origin not echoed for the evil origin
    allow = r.headers.get("access-control-allow-origin")
    assert allow != "https://evil.example.com"
