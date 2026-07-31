

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.api.v1.websocket import router as ws_router
from app.core.config import settings
from app.core.database import engine, init_models
from app.core.exceptions import register_exception_handlers
from app.integrations.storage import UPLOAD_DIR

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not settings.is_prod:
        await init_models()
    logger.info("%s API ready (%s)", settings.PROJECT_NAME, settings.ENVIRONMENT)
    yield
    await engine.dispose()


app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    description="Student housing marketplace for Moroccan universities.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router)

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/", tags=["health"])
async def root() -> dict:
    return {
        "name": settings.PROJECT_NAME,
        "version": app.version,
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "environment": settings.ENVIRONMENT}
