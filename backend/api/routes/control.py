from fastapi import APIRouter

from api.deps import ServicesDep, WorldDep
from domain import Event

router = APIRouter()


@router.post("/worlds/{world_id}/step")
async def step(world: WorldDep, services: ServicesDep) -> list[Event]:
    return await services.engine.step(world.id)
