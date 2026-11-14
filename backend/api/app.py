from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import ROUTERS
from api.services import build_services
from config import CORS_ORIGINS, DATABASE_URL
from data import connect


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    db = await connect(DATABASE_URL)
    app.state.services = build_services(db)
    yield
    await app.state.services.runners.stop_all()
    await db.dispose()


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for router in ROUTERS:
        app.include_router(router)
    return app


app = create_app()
