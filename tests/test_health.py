"""Health / liveness endpoints and the Prometheus scrape target."""
import os

from tests.helpers import bearer


async def test_health_reports_operational(client):
    r = await client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "operational"
    assert data["service"] == "tollgate-gateway-api"
    assert isinstance(data["version"], str)
    assert isinstance(data["uptimeSeconds"], int) and data["uptimeSeconds"] >= 0
    assert data["checks"] == {"api": "ok", "database": "ok"}
    components = data["components"]
    assert {"api", "database", "guardrails", "upstream"} <= set(components)
    assert components["database"]["status"] == "ok"
    assert isinstance(components["database"]["latencyMs"], int)
    assert set(components["guardrails"]["engines"]) == {"prompt_injection", "pii", "toxicity"}


async def test_health_needs_no_auth_and_leaks_no_secrets(client):
    body = (await client.get("/api/health")).text
    for name in ("MONGO_URL", "JWT_SECRET", "API_KEY_HMAC_SECRET", "LLM_API_KEY"):
        value = os.environ.get(name)
        if value:
            assert value not in body


async def test_liveness(client):
    r = await client.get("/api/health/live")
    assert r.status_code == 200
    assert r.json()["status"] == "alive"


async def test_prometheus_metrics_exposed(client):
    await client.get("/api/health")
    token = os.environ.get("METRICS_TOKEN", "")
    r = await client.get("/metrics", headers=bearer(token) if token else {})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/plain")
    assert "tollgate_http_requests_total" in r.text
    assert "tollgate_http_request_duration_seconds_bucket" in r.text


async def test_prometheus_metrics_require_token_when_configured(client):
    if not os.environ.get("METRICS_TOKEN"):
        return
    assert (await client.get("/metrics")).status_code == 401
    assert (await client.get("/metrics", headers=bearer("wrong"))).status_code == 401
