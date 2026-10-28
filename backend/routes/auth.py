from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo.errors import DuplicateKeyError

from accounts import create_account
from db import db
from ratelimit import client_ip
from schemas import (AuthResponse, CurrentUser, MeResponse, ProfileUpdateSchema, SignInRequest, SignUpRequest,
                     UserResponseSchema, WorkspaceResponseSchema)
from security import DUMMY_PASSWORD_HASH, create_access_token, get_current_user, verify_password_async

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW = timedelta(minutes=15)
INVALID_CREDENTIALS = "Invalid email or password"


def _auth_payload(user: dict, workspace: dict) -> AuthResponse:
    token, ttl = create_access_token(user)
    return AuthResponse(token=token, expiresIn=ttl, user=UserResponseSchema.from_db(user),
                        workspace=WorkspaceResponseSchema.from_db(workspace, user["role"]))


async def _me(user_id: str) -> MeResponse:
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    workspace = await db.workspaces.find_one({"id": user["workspace_id"], "members.user_id": user_id}, {"_id": 0})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return MeResponse(user=UserResponseSchema.from_db(user), workspace=WorkspaceResponseSchema.from_db(workspace, user["role"]))


@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(body: SignUpRequest):
    email = body.email.lower()
    if await db.users.find_one({"email": email}, {"_id": 1}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    try:
        user, workspace = await create_account(db, name=body.name, email=email, password=body.password)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    return _auth_payload(user, workspace)


@router.post("/signin", response_model=AuthResponse)
async def signin(body: SignInRequest, request: Request):
    email = body.email.lower()
    identifier = f"{client_ip(request)}:{email}"
    now = datetime.now(timezone.utc)

    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt["count"] >= MAX_FAILED_ATTEMPTS and attempt["expires_at"] > now:
        raise HTTPException(status_code=429, detail="Too many failed sign-in attempts. Try again in 15 minutes.")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    # Always run exactly one bcrypt check so unknown emails take the same time as wrong passwords.
    password_ok = await verify_password_async(body.password, user["password_hash"] if user else DUMMY_PASSWORD_HASH)
    if not user or not password_ok:
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"expires_at": now + LOCKOUT_WINDOW}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail=INVALID_CREDENTIALS)

    await db.login_attempts.delete_one({"identifier": identifier})
    workspace = await db.workspaces.find_one({"id": user["workspace_id"], "members.user_id": user["id"]}, {"_id": 0})
    if not workspace:
        raise HTTPException(status_code=401, detail=INVALID_CREDENTIALS)
    return _auth_payload(user, workspace)


@router.get("/me", response_model=MeResponse)
async def me(current_user: CurrentUser = Depends(get_current_user)):
    return await _me(current_user.id)


@router.put("/profile", response_model=MeResponse)
async def update_profile(body: ProfileUpdateSchema, current_user: CurrentUser = Depends(get_current_user)):
    updates = {k: (v.strip() if isinstance(v, str) else v) for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if updates.get("name") == "":
        raise HTTPException(status_code=422, detail="Display name is required")
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"id": current_user.id}, {"$set": updates})
    return await _me(current_user.id)
