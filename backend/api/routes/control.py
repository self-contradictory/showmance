from fastapi import APIRouter

from api.deps import ServicesDep, WorldDep
from domain import Event

router = APIRouter()


@router.post("/worlds/{world_id}/step")
async def step(world: WorldDep, services: ServicesDep) -> list[Event]:
    return await services.engine.step(world.id)


@router.post("/worlds/{world_id}/start", status_code=204)
async def start(world: WorldDep, services: ServicesDep) -> None:
    services.runners.start(world.id)


@router.post("/worlds/{world_id}/stop", status_code=204)
async def stop(world: WorldDep, services: ServicesDep) -> None:
    await services.runners.stop(world.id)
