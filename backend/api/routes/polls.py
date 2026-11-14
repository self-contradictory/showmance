from fastapi import APIRouter, HTTPException

from api.deps import ServicesDep, ViewerDep, WorldDep
from api.schemas import PollView, VoteRequest

router = APIRouter()


@router.get("/worlds/{world_id}/poll")
async def current_poll(world: WorldDep, services: ServicesDep) -> PollView | None:
    poll = await services.store.polls.current(world.id)
    if poll is None:
        return None
    return PollView(poll=poll, votes=await services.store.polls.tally(poll))


@router.post("/worlds/{world_id}/poll/vote", status_code=204)
async def vote(
    body: VoteRequest, world: WorldDep, viewer: ViewerDep, services: ServicesDep
) -> None:
    poll = await services.store.polls.current(world.id)
    if poll is None:
        raise HTTPException(status_code=404, detail="no open poll")
    if body.option >= len(poll.options):
        raise HTTPException(status_code=422, detail="no such option")
    await services.store.polls.vote(poll.id, viewer.id, body.option)
