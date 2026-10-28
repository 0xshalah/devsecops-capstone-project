from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from db import db
from ids import new_id
from schemas import (ApiKeyCreatedResponse, ApiKeyCreateRequest, ApiKeyDeleteResponse, ApiKeyInDB, ApiKeyResponseSchema,
                     ApiKeyUpdateRequest, CurrentUser, KeyEnv)
from security import generate_api_key, require_roles

router = APIRouter(prefix="/keys", tags=["keys"])
READ_ROLES = ["Owner", "Admin", "Member", "Viewer"]
WRITE_ROLES = ["Owner", "Admin"]
NOT_FOUND = "API Key not found"


def _scoped(key_id: str, user: CurrentUser) -> dict:
    # BOLA: every lookup is bound to the caller's workspace; deleted keys are invisible.
    return {"id": key_id, "workspace_id": user.workspace_id, "deleted_at": None}


@router.get("", response_model=List[ApiKeyResponseSchema])
async def list_keys(env: Optional[KeyEnv] = None, user: CurrentUser = Depends(require_roles(READ_ROLES))):
    query = {"workspace_id": user.workspace_id, "deleted_at": None}
    if env:
        query["env"] = env
    docs = await db.api_keys.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [ApiKeyResponseSchema.from_db(d) for d in docs]


@router.post("", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_key(body: ApiKeyCreateRequest, user: CurrentUser = Depends(require_roles(WRITE_ROLES))):
    material = generate_api_key(body.env)
    doc = ApiKeyInDB(
        id=new_id("key"), workspace_id=user.workspace_id, user_id=user.id, name=body.name.strip(), env=body.env,
        prefix=material["prefix"], last4=material["last4"], key_hash=material["key_hash"],
        scopes=sorted(set(body.scopes)), rate_limit=body.rateLimit, quota=body.quota, status="active",
        created_at=datetime.now(timezone.utc),
    ).model_dump()
    await db.api_keys.insert_one(dict(doc))
    return ApiKeyCreatedResponse(key=ApiKeyResponseSchema.from_db(doc), secret=material["raw"])


@router.patch("/{key_id}", response_model=ApiKeyResponseSchema)
async def update_key(key_id: str, body: ApiKeyUpdateRequest, user: CurrentUser = Depends(require_roles(WRITE_ROLES))):
    fields = body.model_dump(exclude_unset=True, exclude_none=True)
    if not fields:
        raise HTTPException(status_code=422, detail="No updatable fields provided")
    now = datetime.now(timezone.utc)
    updates = {"updated_at": now}
    if "name" in fields:
        updates["name"] = fields["name"].strip()
    if "scopes" in fields:
        updates["scopes"] = sorted(set(fields["scopes"]))
    if "rateLimit" in fields:
        updates["rate_limit"] = fields["rateLimit"]
    if fields.get("status") == "revoked":
        updates.update(status="revoked", revoked_at=now)
    doc = await db.api_keys.find_one_and_update(
        _scoped(key_id, user), {"$set": updates}, projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    if not doc:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return ApiKeyResponseSchema.from_db(doc)


@router.post("/{key_id}/rotate", response_model=ApiKeyCreatedResponse)
async def rotate_key(key_id: str, user: CurrentUser = Depends(require_roles(WRITE_ROLES))):
    existing = await db.api_keys.find_one(_scoped(key_id, user), {"_id": 0, "env": 1, "status": 1})
    if not existing:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    if existing["status"] != "active":
        raise HTTPException(status_code=409, detail="Only active keys can be rotated")
    material = generate_api_key(existing["env"])
    now = datetime.now(timezone.utc)
    doc = await db.api_keys.find_one_and_update(
        {**_scoped(key_id, user), "status": "active"},
        {"$set": {"prefix": material["prefix"], "last4": material["last4"], "key_hash": material["key_hash"],
                  "rotated_at": now, "updated_at": now}},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return ApiKeyCreatedResponse(key=ApiKeyResponseSchema.from_db(doc), secret=material["raw"])


@router.delete("/{key_id}", response_model=ApiKeyDeleteResponse)
async def delete_key(key_id: str, user: CurrentUser = Depends(require_roles(WRITE_ROLES))):
    """Active key -> revoked. Revoked key -> removed from the list (soft delete keeps the audit trail)."""
    now = datetime.now(timezone.utc)
    revoked = await db.api_keys.find_one_and_update(
        {**_scoped(key_id, user), "status": "active"},
        {"$set": {"status": "revoked", "revoked_at": now, "updated_at": now}}, projection={"_id": 0, "id": 1},
    )
    if revoked:
        return ApiKeyDeleteResponse(id=key_id, result="revoked")
    deleted = await db.api_keys.find_one_and_update(
        {**_scoped(key_id, user), "status": "revoked"},
        {"$set": {"deleted_at": now, "updated_at": now}}, projection={"_id": 0, "id": 1},
    )
    if not deleted:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return ApiKeyDeleteResponse(id=key_id, result="deleted")
