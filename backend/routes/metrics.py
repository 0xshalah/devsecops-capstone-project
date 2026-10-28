from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from db import db
from schemas import (ApiKeyContext, CurrentUser, Granularity, MetricsOverviewResponse, MetricsWindow, RuleCount,
                     TrafficBucketResponse)
from security import require_roles, verify_api_key_scope

router = APIRouter(tags=["metrics"])
READ_ROLES = ["Owner", "Admin", "Member", "Viewer"]
WINDOWS = {"1h": timedelta(hours=1), "24h": timedelta(hours=24), "7d": timedelta(days=7), "30d": timedelta(days=30)}
UNITS = {"hour": timedelta(hours=1), "day": timedelta(days=1)}
MAX_BUCKETS = {"hour": 168, "day": 90}


def _count(status: str) -> dict:
    return {"$sum": {"$cond": [{"$eq": ["$status", status]}, 1, 0]}}


async def overview(workspace_id: str, window: str) -> MetricsOverviewResponse:
    match = {"workspace_id": workspace_id, "timestamp": {"$gte": datetime.now(timezone.utc) - WINDOWS[window]}}
    totals = await db.security_logs.aggregate([
        {"$match": match},
        {"$group": {"_id": None, "total": {"$sum": 1}, "blocked": _count("blocked"), "flagged": _count("flagged"),
                    "clean": _count("clean"), "latency": {"$avg": "$latency_ms"}, "tokens": {"$sum": "$tokens"}}},
    ]).to_list(1)
    rules = await db.security_logs.aggregate([
        {"$match": {**match, "status": "blocked", "rule": {"$ne": None}}},
        {"$group": {"_id": "$rule", "count": {"$sum": 1}}},
        {"$sort": {"count": -1, "_id": 1}}, {"$limit": 6},
    ]).to_list(6)
    active_keys = await db.api_keys.count_documents({"workspace_id": workspace_id, "status": "active", "deleted_at": None})
    t = totals[0] if totals else {"total": 0, "blocked": 0, "flagged": 0, "clean": 0, "latency": 0, "tokens": 0}
    return MetricsOverviewResponse(
        window=window, totalRequests=t["total"], blockedCount=t["blocked"],
        blockedPct=round(t["blocked"] * 100 / t["total"], 2) if t["total"] else 0.0,
        flaggedCount=t["flagged"], cleanCount=t["clean"], avgLatencyMs=round(t["latency"] or 0),
        activeKeys=active_keys, tokenVolume=t["tokens"], topRules=[RuleCount(rule=r["_id"], count=r["count"]) for r in rules],
    )


def _truncate(dt: datetime, granularity: str) -> datetime:
    dt = dt.replace(minute=0, second=0, microsecond=0)
    return dt.replace(hour=0) if granularity == "day" else dt


async def traffic(workspace_id: str, granularity: str, buckets: Optional[int]) -> List[TrafficBucketResponse]:
    count = min(buckets or (24 if granularity == "hour" else 7), MAX_BUCKETS[granularity])
    end = _truncate(datetime.now(timezone.utc), granularity)
    start = end - UNITS[granularity] * (count - 1)
    rows = await db.security_logs.aggregate([
        {"$match": {"workspace_id": workspace_id, "timestamp": {"$gte": start}}},
        {"$group": {"_id": {"$dateTrunc": {"date": "$timestamp", "unit": granularity, "timezone": "UTC"}},
                    "requests": {"$sum": 1}, "clean": _count("clean"), "blocks": _count("blocked"),
                    "flagged": _count("flagged"), "latency": {"$avg": "$latency_ms"}, "tokens": {"$sum": "$tokens"}}},
    ]).to_list(count)
    by_bucket = {r["_id"].astimezone(timezone.utc): r for r in rows}
    out = []
    for i in range(count):
        t = start + UNITS[granularity] * i
        r = by_bucket.get(t, {})
        out.append(TrafficBucketResponse(t=t, requests=r.get("requests", 0), clean=r.get("clean", 0),
                                         blocks=r.get("blocks", 0), flagged=r.get("flagged", 0),
                                         latency=round(r.get("latency") or 0), tokens=r.get("tokens", 0)))
    return out


@router.get("/metrics/overview", response_model=MetricsOverviewResponse)
async def metrics_overview(window: MetricsWindow = "24h", user: CurrentUser = Depends(require_roles(READ_ROLES))):
    return await overview(user.workspace_id, window)


@router.get("/metrics/traffic", response_model=List[TrafficBucketResponse])
async def metrics_traffic(granularity: Granularity = "hour", buckets: Optional[int] = Query(None, ge=1, le=168),
                          user: CurrentUser = Depends(require_roles(READ_ROLES))):
    return await traffic(user.workspace_id, granularity, buckets)


@router.get("/gateway/metrics/overview", response_model=MetricsOverviewResponse)
async def gateway_metrics_overview(window: MetricsWindow = "24h",
                                   key: ApiKeyContext = Depends(verify_api_key_scope("metrics:read"))):
    return await overview(key.workspace_id, window)


@router.get("/gateway/metrics/traffic", response_model=List[TrafficBucketResponse])
async def gateway_metrics_traffic(granularity: Granularity = "hour", buckets: Optional[int] = Query(None, ge=1, le=168),
                                  key: ApiKeyContext = Depends(verify_api_key_scope("metrics:read"))):
    return await traffic(key.workspace_id, granularity, buckets)
