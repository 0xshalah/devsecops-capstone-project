from fastapi import APIRouter, Depends

from db import db
from schemas import CurrentUser, WorkspaceResponseSchema
from security import verify_workspace_access

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("/{workspace_id}", response_model=WorkspaceResponseSchema)
async def get_workspace(workspace_id: str, current_user: CurrentUser = Depends(verify_workspace_access)):
    workspace = await db.workspaces.find_one({"id": workspace_id, "members.user_id": current_user.id}, {"_id": 0})
    role = next(m["role"] for m in workspace["members"] if m["user_id"] == current_user.id)
    return WorkspaceResponseSchema.from_db(workspace, role)
