"""OWASP API1 (BOLA -> 404), API5 (BFLA -> 403) and API3 (BOPLA / mass assignment -> 422)."""
import pytest

from tests.helpers import INJECTION_PROMPT, STRONG_PASSWORD, unique_email

NOT_FOUND = "API Key not found"


async def _evaluate(client, headers, prompt=INJECTION_PROMPT):
    r = await client.post("/api/playground/evaluate", json={"prompt": prompt}, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- BOLA ----------
async def test_user_b_cannot_list_or_modify_user_a_keys(client, signup, create_key):
    a, b = await signup("tenant-a"), await signup("tenant-b")
    key_id = (await create_key(a["headers"], name="tenant-a-key"))["key"]["id"]

    listing = await client.get("/api/keys", headers=b["headers"])
    assert listing.status_code == 200
    assert key_id not in {k["id"] for k in listing.json()}

    attempts = [("PATCH", f"/api/keys/{key_id}", {"status": "revoked"}),
                ("PATCH", f"/api/keys/{key_id}", {"name": "pwned"}),
                ("POST", f"/api/keys/{key_id}/rotate", None),
                ("DELETE", f"/api/keys/{key_id}", None)]
    for method, path, body in attempts:
        r = await client.request(method, path, json=body, headers=b["headers"])
        assert r.status_code == 404, f"{method} {path} -> {r.status_code}"
        assert r.json()["detail"] == NOT_FOUND

    owned = next(k for k in (await client.get("/api/keys", headers=a["headers"])).json() if k["id"] == key_id)
    assert owned["status"] == "active" and owned["name"] == "tenant-a-key"


async def test_foreign_and_missing_keys_return_identical_404(client, signup, create_key):
    a, b = await signup("enum-a"), await signup("enum-b")
    foreign_id = (await create_key(a["headers"]))["key"]["id"]
    foreign = await client.delete(f"/api/keys/{foreign_id}", headers=b["headers"])
    missing = await client.delete("/api/keys/key_000000000000000000000000", headers=b["headers"])
    assert foreign.status_code == missing.status_code == 404
    assert foreign.json() == missing.json()


async def test_user_b_cannot_read_user_a_logs(client, signup, create_key):
    a, b = await signup("logs-a"), await signup("logs-b")
    request_id = (await _evaluate(client, a["headers"]))["requestId"]

    own = await client.get("/api/logs", params={"q": request_id}, headers=a["headers"])
    assert own.status_code == 200 and own.json()["total"] == 1

    other = await client.get("/api/logs", params={"q": request_id}, headers=b["headers"])
    assert other.status_code == 200 and other.json()["total"] == 0

    # A client-supplied workspace id is ignored; scope always comes from the verified credential.
    tampered = await client.get("/api/logs", params={"q": request_id, "workspace_id": a["workspace"]["id"],
                                                     "workspaceId": a["workspace"]["id"]}, headers=b["headers"])
    assert tampered.json()["total"] == 0

    b_key = (await create_key(b["headers"], scopes=["logs:read"]))["secret"]
    via_key = await client.get("/api/gateway/logs", params={"q": request_id}, headers={"X-API-Key": b_key})
    assert via_key.status_code == 200 and via_key.json()["total"] == 0


async def test_user_b_cannot_read_user_a_workspace(client, signup):
    a, b = await signup("ws-a"), await signup("ws-b")
    assert (await client.get(f"/api/workspaces/{a['workspace']['id']}", headers=a["headers"])).status_code == 200
    assert (await client.get(f"/api/workspaces/{a['workspace']['id']}", headers=b["headers"])).status_code == 404


async def test_settings_are_isolated_per_workspace(client, signup):
    a, b = await signup("settings-a"), await signup("settings-b")
    r = await client.put("/api/settings", json={"defaultAction": "flag"}, headers=a["headers"])
    assert r.status_code == 200
    assert (await client.get("/api/settings", headers=b["headers"])).json()["defaultAction"] == "block"


# ---------- BFLA ----------
WRITE_CALLS = [
    ("POST", "/api/keys", {"name": "escalation"}),
    ("PATCH", "/api/keys/key_000000000000000000000000", {"name": "x"}),
    ("POST", "/api/keys/key_000000000000000000000000/rotate", None),
    ("DELETE", "/api/keys/key_000000000000000000000000", None),
    ("PUT", "/api/settings", {"defaultAction": "flag"}),
]


@pytest.mark.parametrize("role", ["Viewer", "Member"])
@pytest.mark.parametrize("method,path,body", WRITE_CALLS)
async def test_non_admin_roles_cannot_call_write_endpoints(client, make_role, role, method, path, body):
    account = await make_role(role)
    r = await client.request(method, path, json=body, headers=account["headers"])
    assert r.status_code == 403, f"{role} {method} {path} -> {r.status_code}"
    assert r.json()["detail"] == "Insufficient permissions to perform this action"


async def test_viewer_can_use_read_endpoints(client, make_role):
    viewer = await make_role("Viewer")
    for path in ("/api/keys", "/api/settings", "/api/logs", "/api/metrics/overview", "/api/metrics/traffic"):
        r = await client.get(path, headers=viewer["headers"])
        assert r.status_code == 200, f"{path} -> {r.status_code}"


async def test_admin_can_manage_keys_and_settings(client, make_role, create_key):
    admin = await make_role("Admin")
    key_id = (await create_key(admin["headers"]))["key"]["id"]
    assert (await client.delete(f"/api/keys/{key_id}", headers=admin["headers"])).status_code == 200
    assert (await client.put("/api/settings", json={"toxicityFilter": False}, headers=admin["headers"])).status_code == 200


# ---------- BOPLA / mass assignment ----------
async def test_viewer_cannot_self_promote_via_profile(client, make_role):
    viewer = await make_role("Viewer")
    r = await client.put("/api/auth/profile", json={"name": "Sneaky", "role": "Owner"}, headers=viewer["headers"])
    assert r.status_code == 422
    me = (await client.get("/api/auth/me", headers=viewer["headers"])).json()["user"]
    assert me["role"] == "Viewer" and me["name"] != "Sneaky"


async def test_signup_with_role_owner_is_rejected(client):
    body = {"name": "Mallory", "email": unique_email("mass"), "password": STRONG_PASSWORD, "role": "Owner"}
    assert (await client.post("/api/auth/signup", json=body)).status_code == 422


@pytest.mark.parametrize("body", [
    {"name": "k", "workspace_id": "ws_victim"},
    {"name": "k", "user_id": "usr_victim"},
    {"name": "k", "key_hash": "0" * 64},
    {"name": "k", "status": "active"},
    {"name": "k", "scopes": ["admin:*"]},
])
async def test_key_create_rejects_unknown_or_protected_fields(client, signup, body):
    owner = await signup("key-bopla")
    assert (await client.post("/api/keys", json=body, headers=owner["headers"])).status_code == 422


@pytest.mark.parametrize("body", [
    {"status": "active"}, {"key_hash": "0" * 64}, {"workspace_id": "ws_victim"}, {"env": "live"}, {"prefix": "sk-gw-x"},
])
async def test_key_patch_rejects_protected_fields(client, signup, create_key, body):
    owner = await signup("patch-bopla")
    key_id = (await create_key(owner["headers"]))["key"]["id"]
    assert (await client.patch(f"/api/keys/{key_id}", json=body, headers=owner["headers"])).status_code == 422


@pytest.mark.parametrize("body", [
    {"workspace_id": "ws_victim"}, {"updated_by": "usr_x"}, {"piiRedaction": {"email": False, "admin": True}},
    {"injectionThreshold": 0},
])
async def test_settings_update_rejects_protected_or_invalid_fields(client, signup, body):
    owner = await signup("settings-bopla")
    assert (await client.put("/api/settings", json=body, headers=owner["headers"])).status_code == 422
