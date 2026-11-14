from fastapi import APIRouter, HTTPException, Response

from api.deps import ServicesDep, WorldDep
from data import NotFound

router = APIRouter()


@router.get("/worlds/{world_id}/events/{event_id}/audio")
async def event_audio(
    event_id: int, world: WorldDep, services: ServicesDep
) -> Response:
    try:
        event = await services.store.events.get(event_id)
    except NotFound:
        event = None
    if event is None or event.world_id != world.id:
        raise HTTPException(status_code=404, detail="event not found")
    audio = await services.narrator.audio(event)
    if audio is None:
        raise HTTPException(status_code=404, detail="nobody speaks in this event")
    return Response(
        content=audio.content,
        media_type=audio.media_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
