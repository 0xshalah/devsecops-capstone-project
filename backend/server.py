import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
sys.path.append(str(ROOT_DIR.parent))  # exposes the top-level database/ package

import logging  # noqa: E402
import os  # noqa: E402
from contextlib import asynccontextmanager  # noqa: E402

from fastapi import APIRouter, FastAPI  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402

from database.init_db import init_db  # noqa: E402
from database.seed import seed_database  # noqa: E402
from db import client, db  # noqa: E402
from routes.auth import router as auth_router  # noqa: E402
from routes.workspaces import router as workspaces_router  # noqa: E402
from routes.keys import router as keys_router  # noqa: E402
from routes.gateway import router as gateway_router  # noqa: E402
from routes.health import router as health_router  # noqa: E402
from routes.logs import router as logs_router  # noqa: E402
from routes.metrics import router as metrics_router  # noqa: E402
from routes.settings import router as settings_router  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db(db)
    await seed_database(db)
    yield
    client.close()


app = FastAPI(title="Tollgate AI Security Gateway", lifespan=lifespan)
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Tollgate AI Security Gateway API"}


for r in (health_router, auth_router, workspaces_router, keys_router, gateway_router, logs_router, metrics_router,
          settings_router):
    api_router.include_router(r)
app.include_router(api_router)

cors_origins = [o.strip() for o in os.environ["CORS_ORIGINS"].split(",") if o.strip()]
allow_wildcard = "*" in cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=not allow_wildcard,  # browsers reject credentials with a wildcard origin
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
)
