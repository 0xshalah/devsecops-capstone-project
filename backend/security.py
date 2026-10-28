import asyncio
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db import db
from schemas import ApiKeyContext, CurrentUser

JWT_ALGORITHM = "HS256"
API_KEY_PREFIX = "sk-gw-"
bearer_scheme = HTTPBearer(auto_error=False)


# ---------- Passwords ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


async def verify_password_async(password: str, hashed: str) -> bool:
    return await asyncio.to_thread(verify_password, password, hashed)


# Used when the email is unknown so sign-in always costs one bcrypt check.
DUMMY_PASSWORD_HASH = hash_password(secrets.token_hex(16))


# ---------- JWT ----------
def create_access_token(user: dict) -> tuple[str, int]:
    ttl = int(os.environ["JWT_EXPIRE_MINUTES"]) * 60
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["id"],
        "ws": user["workspace_id"],
        "role": user["role"],
        "type": "access",
        "iat": now,
        "exp": now + timedelta(seconds=ttl),
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM), ttl


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status_code=401, detail=detail, headers={"WWW-Authenticate": "Bearer"})


# ---------- API keys ----------
def hash_api_key(raw_key: str) -> str:
    return hmac.new(os.environ["API_KEY_HMAC_SECRET"].encode(), raw_key.encode(), hashlib.sha256).hexdigest()


def generate_api_key(env: str) -> dict:
    """Returns the one-time plain-text key plus the values safe to store."""
    body = secrets.token_hex(24)
    raw = f"{API_KEY_PREFIX}{env}-{body}"
    return {"raw": raw, "prefix": f"{API_KEY_PREFIX}{env}-{body[:4]}...{body[-4:]}", "last4": body[-4:], "key_hash": hash_api_key(raw)}


# ---------- Dependencies ----------
async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> CurrentUser:
    if creds is None or not creds.credentials:
        raise _unauthorized("Not authenticated")
    token = creds.credentials
    if token.startswith(API_KEY_PREFIX):
        raise _unauthorized("Gateway API keys cannot access console endpoints")
    try:
        payload = jwt.decode(
            token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM],
            options={"require": ["exp", "iat", "sub", "ws", "role"]},
        )
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Session expired")
    except jwt.InvalidTokenError:
        raise _unauthorized("Invalid token")
    if payload.get("type") != "access":
        raise _unauthorized("Invalid token")

    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "id": 1, "email": 1, "role": 1, "workspace_id": 1})
    if not user or user["workspace_id"] != payload["ws"]:
        raise _unauthorized("Invalid token")
    return CurrentUser(**user)


async def verify_workspace_access(workspace_id: str, current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Never trust a client-supplied workspace id: it must be one the user belongs to."""
    ws = await db.workspaces.find_one({"id": workspace_id, "members.user_id": current_user.id}, {"_id": 0, "id": 1})
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return current_user


def require_roles(allowed_roles: List[str]):
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions to perform this action")
        return current_user

    return role_checker


def verify_api_key_scope(required_scope: str):
    async def scope_checker(
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
        creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    ) -> ApiKeyContext:
        raw = x_api_key or (creds.credentials if creds else None)
        if not raw or not raw.startswith(API_KEY_PREFIX):
            raise _unauthorized("Missing or invalid API key")
        digest = hash_api_key(raw)
        key = await db.api_keys.find_one({"key_hash": digest}, {"_id": 0})
        if not key or not secrets.compare_digest(key["key_hash"], digest) or key["status"] != "active":
            raise _unauthorized("Invalid or revoked API key")
        if required_scope not in key["scopes"]:
            raise HTTPException(status_code=403, detail=f"API key is missing required scope: {required_scope}")
        await db.api_keys.update_one(
            {"id": key["id"], "workspace_id": key["workspace_id"]},
            {"$set": {"last_used_at": datetime.now(timezone.utc)}},
        )
        return ApiKeyContext(key_id=key["id"], workspace_id=key["workspace_id"], user_id=key["user_id"], key_name=key["name"],
                             scopes=key["scopes"], rate_limit=key["rate_limit"])

    return scope_checker
