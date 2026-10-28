import math
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request
from pymongo import ReturnDocument

from audit import record_throttle
from db import db
from observability import RATE_LIMITED

WINDOW_SECONDS = 60


@dataclass
class Decision:
    allowed: bool
    limit: int
    remaining: int
    retry_after: int = 0

    def headers(self) -> dict:
        headers = {"X-RateLimit-Limit": str(self.limit), "X-RateLimit-Remaining": str(self.remaining)}
        if not self.allowed:
            headers["Retry-After"] = str(self.retry_after)
        return headers


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")


def _retry_after(prev: int, cur: int, limit: int, elapsed: float, window: int) -> int:
    """Seconds until one more request fits in the sliding window."""
    until_next_window = window - elapsed
    if cur + 1 <= limit:
        wait = min(until_next_window, window * (1 - (limit - cur - 1) / prev) - elapsed) if prev else 0
    else:
        wait = until_next_window + window * max(0.0, 1 - (limit - 1) / cur)
    return max(1, math.ceil(wait))


async def hit(bucket: str, limit: int, window: int = WINDOW_SECONDS) -> Decision:
    """Sliding-window counter stored in MongoDB, so every replica shares the same budget."""
    now = time.time()
    slot = int(now // window)
    elapsed = now - slot * window
    doc = await db.rate_limits.find_one_and_update(
        {"_id": f"{bucket}:{slot}"},
        {"$inc": {"count": 1}, "$setOnInsert": {"expires_at": datetime.fromtimestamp((slot + 2) * window, timezone.utc)}},
        upsert=True, return_document=ReturnDocument.AFTER,
    )
    prev_doc = await db.rate_limits.find_one({"_id": f"{bucket}:{slot - 1}"}, {"count": 1})
    prev = prev_doc["count"] if prev_doc else 0
    used = prev * (1 - elapsed / window) + doc["count"]
    if used <= limit:
        return Decision(True, limit, max(0, math.floor(limit - used)))
    # Rejected requests do not consume budget, so Retry-After stays accurate under sustained abuse.
    await db.rate_limits.update_one({"_id": doc["_id"]}, {"$inc": {"count": -1}})
    return Decision(False, limit, 0, _retry_after(prev, doc["count"] - 1, limit, elapsed, window))


async def enforce(bucket: str, limit: int, *, scope: str, detail: str, log: Optional[dict] = None) -> None:
    """Raises 429 with Retry-After when the bucket is over budget; optionally writes a throttle audit entry."""
    decision = await hit(bucket, limit)
    if decision.allowed:
        return
    RATE_LIMITED.labels(scope=scope).inc()
    if log:
        await record_throttle(db, **log)
    raise HTTPException(status_code=429, detail=detail, headers=decision.headers())
