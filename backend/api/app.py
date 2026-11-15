import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.autopilot import Autopilot
from api.routes import ROUTERS
from api.services import build_services
from config import settings
from data import connect


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    db = await connect(settings.database_url)
    services = build_services(db)
    app.state.services = services
    autopilot = asyncio.create_task(
        Autopilot(services.store, services.runners, services.presence).run()
    )
    yield
    autopilot.cancel()
    with suppress(asyncio.CancelledError):
        await autopilot
    await services.runners.stop_all()
    await db.dispose()


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for router in ROUTERS:
        app.include_router(router)
    return app


app = create_app()
