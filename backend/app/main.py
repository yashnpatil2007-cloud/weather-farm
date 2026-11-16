from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import (
    activities,
    admin,
    alerts,
    analytics,
    auth,
    crops,
    farms,
    recommendations,
    weather,
)
from .core.config import get_settings
from .core.database import Base, engine
from .core.migrations import run_migrations
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI):
    import app.models  # noqa: F401  register models before create_all
    Base.metadata.create_all(bind=engine)
    run_migrations()
    seed_if_empty()
    yield


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Weather-based agricultural decision support system (prototype).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth.router,
    crops.router,
    farms.router,
    weather.router,
    recommendations.router,
    alerts.router,
    activities.router,
    analytics.router,
    admin.router,
):
    app.include_router(router, prefix=settings.api_prefix)