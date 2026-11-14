from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import APIRouter, Header
from fastapi.sse import EventSourceResponse, ServerSentEvent

from api.deps import ServicesDep, WorldDep
from api.stream import follow
from domain import Event

router = APIRouter()


@router.get("/worlds/{world_id}/events")
async def list_events(
    world: WorldDep, services: ServicesDep, after_id: int = 0
) -> list[Event]:
    return await services.store.events.get_all(world.id, after_id)


@router.get("/worlds/{world_id}/stream", response_class=EventSourceResponse)
async def stream_events(
    world: WorldDep,
    services: ServicesDep,
    after_id: int = 0,
    last_event_id: Annotated[int | None, Header()] = None,
) -> AsyncIterator[ServerSentEvent]:
    start = after_id if last_event_id is None else last_event_id
    async for event in follow(services.store, world.id, start):
        yield ServerSentEvent(data=event, id=str(event.id))
