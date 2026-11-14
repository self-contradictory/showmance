from fastapi import APIRouter

from api.deps import ServicesDep, WorldDep
from api.schemas import Twist
from domain import Event, NewEvent

router = APIRouter()


@router.post("/worlds/{world_id}/twists", status_code=201)
async def drop_twist(twist: Twist, world: WorldDep, services: ServicesDep) -> Event:
    event = NewEvent(world_id=world.id, tick=world.tick, **twist.model_dump())
    return await services.engine.inject(event)
