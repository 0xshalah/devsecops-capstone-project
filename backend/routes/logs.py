import re
from typing import Optional

from fastapi import APIRouter, Depends, Query

from db import db
from schemas import ApiKeyContext, CurrentUser, LogListResponse, LogStatus, SecurityLogResponseSchema, Severity
from security import require_roles, verify_api_key_scope

router = APIRouter(tags=["logs"])
READ_ROLES = ["Owner", "Admin", "Member", "Viewer"]
SEARCH_FIELDS = ["id", "prompt_snippet", "rule", "key_name", "endpoint", "model", "threat_type"]


class LogFilters:
    def __init__(
        self,
        limit: int = Query(50, ge=1, le=200),
        offset: int = Query(0, ge=0, le=100_000),
        page: Optional[int] = Query(None, ge=1, le=10_000),
        q: Optional[str] = Query(None, max_length=100),
        status: Optional[LogStatus] = None,
        severity: Optional[Severity] = None,
    ):
        self.limit = limit
        self.offset = (page - 1) * limit if page else offset
        self.q, self.status, self.severity = (q or "").strip(), status, severity


async def query_logs(workspace_id: str, f: LogFilters) -> LogListResponse:
    # BOLA: the workspace always comes from the verified credential, never from the client.
    query: dict = {"workspace_id": workspace_id}
    if f.status:
        query["status"] = f.status
    if f.severity:
        query["severity"] = f.severity
    if f.q:
        pattern = {"$regex": re.escape(f.q), "$options": "i"}
        query["$or"] = [{field: pattern} for field in SEARCH_FIELDS]
    total = await db.security_logs.count_documents(query)
    docs = await db.security_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(f.offset).limit(f.limit).to_list(f.limit)
    return LogListResponse(
        items=[SecurityLogResponseSchema.from_db(d) for d in docs], total=total, limit=f.limit, offset=f.offset,
        page=f.offset // f.limit + 1, pages=max(1, -(-total // f.limit)),
    )


@router.get("/logs", response_model=LogListResponse)
async def list_logs(f: LogFilters = Depends(), user: CurrentUser = Depends(require_roles(READ_ROLES))):
    return await query_logs(user.workspace_id, f)


@router.get("/gateway/logs", response_model=LogListResponse)
async def gateway_logs(f: LogFilters = Depends(), key: ApiKeyContext = Depends(verify_api_key_scope("logs:read"))):
    return await query_logs(key.workspace_id, f)
