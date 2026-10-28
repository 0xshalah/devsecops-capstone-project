import logging

from pymongo import ASCENDING, DESCENDING, IndexModel

logger = logging.getLogger(__name__)

INDEXES = {
    "users": [
        IndexModel([("email", ASCENDING)], unique=True, name="uniq_email"),
        IndexModel([("id", ASCENDING)], unique=True, name="uniq_id"),
        IndexModel([("workspace_id", ASCENDING)], name="workspace_id"),
    ],
    "workspaces": [
        IndexModel([("id", ASCENDING)], unique=True, name="uniq_id"),
        IndexModel([("owner_id", ASCENDING)], name="owner_id"),
        IndexModel([("members.user_id", ASCENDING)], name="members_user_id"),
    ],
    "api_keys": [
        IndexModel([("key_hash", ASCENDING)], unique=True, name="uniq_key_hash"),
        IndexModel([("workspace_id", ASCENDING), ("id", ASCENDING)], unique=True, name="workspace_id_id"),
    ],
    "security_logs": [
        IndexModel([("workspace_id", ASCENDING), ("timestamp", DESCENDING)], name="workspace_id_timestamp"),
        IndexModel([("status", ASCENDING)], name="status"),
        IndexModel([("severity", ASCENDING)], name="severity"),
    ],
    "gateway_settings": [
        IndexModel([("workspace_id", ASCENDING)], unique=True, name="uniq_workspace_id"),
    ],
    "gateway_metrics": [
        IndexModel([("workspace_id", ASCENDING), ("bucket", DESCENDING)], name="workspace_id_bucket"),
    ],
    "login_attempts": [
        IndexModel([("identifier", ASCENDING)], unique=True, name="uniq_identifier"),
        IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0, name="ttl_expires_at"),
    ],
}


async def init_db(db) -> None:
    existing = set(await db.list_collection_names())
    for name, indexes in INDEXES.items():
        if name not in existing:
            await db.create_collection(name)
        await db[name].create_indexes(indexes)
    logger.info("Database initialised: %s", ", ".join(INDEXES))
