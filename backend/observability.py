import time

from fastapi import Request
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

HTTP_REQUESTS = Counter("tollgate_http_requests_total", "HTTP requests by route and status", ["method", "route", "status"])
HTTP_LATENCY = Histogram(
    "tollgate_http_request_duration_seconds", "HTTP request latency in seconds", ["method", "route"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
)
EVALUATIONS = Counter("tollgate_gateway_evaluations_total", "Guardrail evaluations by outcome", ["endpoint", "status"])
THREATS = Counter("tollgate_guardrail_threats_total", "Threats detected by the guardrail engine", ["type", "severity"])
RATE_LIMITED = Counter("tollgate_rate_limited_total", "Requests rejected by the rate limiter", ["scope"])


def _route_label(request: Request) -> str:
    # Route templates (e.g. /api/keys/{key_id}) keep label cardinality bounded.
    return getattr(request.scope.get("route"), "path", "unmatched")


async def track_requests(request: Request, call_next):
    started = time.perf_counter()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        return response
    finally:
        route = _route_label(request)
        HTTP_REQUESTS.labels(request.method, route, str(status)).inc()
        HTTP_LATENCY.labels(request.method, route).observe(time.perf_counter() - started)


def record_evaluation(endpoint: str, status: str, threats: list) -> None:
    EVALUATIONS.labels(endpoint, status).inc()
    for t in threats:
        THREATS.labels(t.type, t.severity).inc()


def render() -> tuple[bytes, str]:
    return generate_latest(), CONTENT_TYPE_LATEST
