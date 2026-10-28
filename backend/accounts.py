from datetime import datetime, timezone

from ids import new_id
from schemas import GatewaySettingsInDB, UserInDB, WorkspaceInDB, WorkspaceMember
from security import hash_password


def default_settings(workspace_id: str, user_id: str) -> GatewaySettingsInDB:
    return GatewaySettingsInDB(workspace_id=workspace_id, user_id=user_id, updated_at=datetime.now(timezone.utc))


async def create_account(db, *, name: str, email: str, password: str, plan: str = "Free", email_verified: bool = False):
    """Creates a user as Owner of a fresh workspace with default gateway settings."""
    now = datetime.now(timezone.utc)
    user_id, ws_id = new_id("usr"), new_id("ws")
    user = UserInDB(
        id=user_id, email=email.lower(), name=name.strip(), password_hash=hash_password(password), role="Owner",
        plan=plan, workspace_id=ws_id, emailVerified=email_verified, created_at=now, updated_at=now,
    ).model_dump()
    workspace = WorkspaceInDB(
        id=ws_id, name=f"{name.strip()}'s workspace", owner_id=user_id, plan=plan,
        members=[WorkspaceMember(user_id=user_id, role="Owner")], created_at=now,
    ).model_dump()

    await db.users.insert_one(dict(user))
    await db.workspaces.insert_one(dict(workspace))
    await db.gateway_settings.update_one(
        {"workspace_id": ws_id}, {"$setOnInsert": default_settings(ws_id, user_id).model_dump()}, upsert=True
    )
    return user, workspace
