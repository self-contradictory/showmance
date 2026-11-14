import logging

from ai import Director
from config import DIRECTOR_EVENT_LIMIT, TWIST_FAILED_REASON, TWISTS_PER_TICK
from data import Store
from domain import DirectorContext, NewEvent, Rejected, Twist, TwistPlan
from engine.operations import Operations, Staged
from engine.state import WorldState

logger = logging.getLogger(__name__)


class Staging:
    def __init__(self, store: Store, director: Director) -> None:
        self._store = store
        self._director = director
        self._operations = Operations(store)

    async def run(self, state: WorldState) -> Staged:
        staged = Staged()
        for twist in await self._store.twists.pending(state.world.id, TWISTS_PER_TICK):
            staged.merge(await self._stage(twist, state))
        return staged

    async def _stage(self, twist: Twist, state: WorldState) -> Staged:
        outcome = await self._plan(twist, state)
        if isinstance(outcome, Rejected):
            await self._store.twists.reject(twist.id, outcome.reason, state.world.tick)
            return Staged()
        headline = await self._store.events.add(
            NewEvent(
                world_id=state.world.id,
                tick=state.world.tick,
                kind="twist",
                text=outcome.summary,
                data={"twist_id": twist.id},
            )
        )
        staged = await self._operations.apply(outcome, twist, state)
        staged.events.insert(0, headline)
        await self._store.twists.stage(twist.id, outcome.summary, state.world.tick)
        return staged

    async def _plan(self, twist: Twist, state: WorldState) -> TwistPlan | Rejected:
        context = DirectorContext(
            world=state.world,
            agents=state.agents,
            locations=state.locations,
            relationships=state.relationships,
            events=await self._store.events.recent(
                state.world.id, DIRECTOR_EVENT_LIMIT
            ),
        )
        try:
            return await self._director.stage(twist.text, context)
        except Exception:
            logger.exception("director failed on twist %s", twist.id)
            return Rejected(reason=TWIST_FAILED_REASON)
