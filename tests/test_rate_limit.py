"""Sliding-window rate limiting: per API key, per workspace and the limiter itself."""
import uuid

from ratelimit import hit
from tests.helpers import INJECTION_PROMPT

COMPLETION = {"messages": [{"role": "user", "content": INJECTION_PROMPT}]}


async def test_sliding_window_allows_up_to_limit_then_rejects():
    bucket = f"pytest:{uuid.uuid4().hex}"
    first, second, third = [await hit(bucket, 2) for _ in range(3)]
    assert first.allowed and second.allowed
    assert first.remaining == 1 and second.remaining == 0
    assert not third.allowed
    assert third.retry_after >= 1
    assert third.headers()["Retry-After"] == str(third.retry_after)


async def test_rejected_requests_do_not_consume_budget(mongo):
    bucket = f"pytest:{uuid.uuid4().hex}"
    for _ in range(5):
        await hit(bucket, 1)
    docs = await mongo.rate_limits.find({"_id": {"$regex": f"^{bucket}:"}}).to_list(5)
    assert sum(d["count"] for d in docs) == 1


async def test_api_key_rate_limit_returns_429_with_retry_after(client, signup, create_key):
    owner = await signup("key-limit")
    created = await create_key(owner["headers"], rateLimit=2)
    headers = {"X-API-Key": created["secret"]}
    statuses = [(await client.post("/api/gateway/completions", json=COMPLETION, headers=headers)) for _ in range(3)]
    assert [r.status_code for r in statuses[:2]] == [403, 403]  # blocked by guardrails, still within budget
    throttled = statuses[2]
    assert throttled.status_code == 429
    assert throttled.json()["detail"] == "API key rate limit exceeded"
    assert int(throttled.headers["Retry-After"]) >= 1
    assert throttled.headers["X-RateLimit-Limit"] == "2"
    assert throttled.headers["X-RateLimit-Remaining"] == "0"

    logs = (await client.get("/api/logs", params={"q": "Rate Limit"}, headers=owner["headers"])).json()
    assert any(i["keyId"] == created["key"]["id"] and i["status"] == 429 and i["action"] == "throttle"
               for i in logs["items"])


async def test_rate_limit_is_per_key(client, signup, create_key):
    owner = await signup("key-isolation")
    limited = (await create_key(owner["headers"], rateLimit=1))["secret"]
    other = (await create_key(owner["headers"], rateLimit=100))["secret"]
    await client.post("/api/gateway/completions", json=COMPLETION, headers={"X-API-Key": limited})
    assert (await client.post("/api/gateway/completions", json=COMPLETION, headers={"X-API-Key": limited})).status_code == 429
    assert (await client.post("/api/gateway/completions", json=COMPLETION, headers={"X-API-Key": other})).status_code == 403


async def test_workspace_global_rate_limit(client, signup):
    owner = await signup("ws-limit")
    assert (await client.put("/api/settings", json={"globalRateLimit": 2}, headers=owner["headers"])).status_code == 200
    body = {"prompt": INJECTION_PROMPT}
    statuses = [(await client.post("/api/playground/evaluate", json=body, headers=owner["headers"])) for _ in range(3)]
    assert [r.status_code for r in statuses[:2]] == [200, 200]
    assert statuses[2].status_code == 429
    assert statuses[2].json()["detail"] == "Workspace rate limit exceeded"
    assert "Retry-After" in statuses[2].headers


async def test_health_is_exempt_from_ip_limit(client):
    r = await client.get("/api/health/live")
    assert r.status_code == 200
    assert "X-RateLimit-Limit" not in r.headers
