import asyncio
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Response

from db import db
from guardrails import upstream

router = APIRouter(tags=["health"])
VERSION = "0.3.0"
STARTED_AT = datetime.now(timezone.utc)
_START = time.monotonic()
DB_TIMEOUT_SECONDS = 2


async def _ping_db() -> tuple[bool, int]:
    started = time.perf_counter()
    try:
        await asyncio.wait_for(db.command("ping"), DB_TIMEOUT_SECONDS)
        ok = True
    except Exception:
        ok = False
    return ok, round((time.perf_counter() - started) * 1000)


@router.get("/health")
async def health(response: Response):
    """Readiness: 200 when every dependency is healthy, 503 otherwise."""
    db_ok, db_latency = await _ping_db()
    status = "operational" if db_ok else "degraded"
    if not db_ok:
        response.status_code = 503
    provider = upstream.provider_name()
    return {
        "status": status,
        "service": "tollgate-gateway-api",
        "version": VERSION,
        "uptimeSeconds": int(time.monotonic() - _START),
        "startedAt": STARTED_AT.isoformat(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {"api": "ok", "database": "ok" if db_ok else "unreachable"},
        "components": {
            "api": {"status": "ok"},
            "database": {"status": "ok" if db_ok else "unreachable", "latencyMs": db_latency},
            "guardrails": {"status": "ok", "engines": ["prompt_injection", "pii", "toxicity"]},
            "upstream": {"status": "ok" if provider != upstream.PLACEHOLDER else "placeholder", "provider": provider},
        },
    }


@router.get("/health/live")
async def liveness():
    """Liveness: the process is up; never touches dependencies."""
    return {"status": "alive", "uptimeSeconds": int(time.monotonic() - _START)}
