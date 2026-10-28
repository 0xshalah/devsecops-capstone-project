from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from accounts import default_settings
from db import db
from schemas import CurrentUser, GatewaySettingsResponse, GatewaySettingsUpdate
from security import require_roles

router = APIRouter(prefix="/settings", tags=["settings"])
READ_ROLES = ["Owner", "Admin", "Member", "Viewer"]
WRITE_ROLES = ["Owner", "Admin"]
FIELD_MAP = {"defaultAction": "default_action", "injectionThreshold": "injection_threshold",
             "toxicityFilter": "toxicity_filter", "globalRateLimit": "global_rate_limit"}


async def ensure_settings(workspace_id: str, user_id: str) -> dict:
    """Returns the workspace settings, creating the defaults on first access."""
    return await db.gateway_settings.find_one_and_update(
        {"workspace_id": workspace_id},
        {"$setOnInsert": default_settings(workspace_id, user_id).model_dump()},
        upsert=True, projection={"_id": 0}, return_document=ReturnDocument.AFTER,
    )


@router.get("", response_model=GatewaySettingsResponse)
async def get_settings(user: CurrentUser = Depends(require_roles(READ_ROLES))):
    return GatewaySettingsResponse.from_db(await ensure_settings(user.workspace_id, user.id))


@router.put("", response_model=GatewaySettingsResponse)
async def update_settings(body: GatewaySettingsUpdate, user: CurrentUser = Depends(require_roles(WRITE_ROLES))):
    fields = body.model_dump(exclude_none=True)
    pii_updates = fields.pop("piiRedaction", {})
    updates = {FIELD_MAP[k]: v for k, v in fields.items()}
    updates.update({f"pii_redaction.{k}": v for k, v in pii_updates.items()})
    if not updates:
        raise HTTPException(status_code=422, detail="No updatable fields provided")
    await ensure_settings(user.workspace_id, user.id)
    doc = await db.gateway_settings.find_one_and_update(
        {"workspace_id": user.workspace_id},
        {"$set": {**updates, "updated_at": datetime.now(timezone.utc), "updated_by": user.id}},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER,
    )
    return GatewaySettingsResponse.from_db(doc)
