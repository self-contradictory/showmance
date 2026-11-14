import logging

from ai import Director
from config import settings
from data import Store
from domain import DirectorContext, Event, NewEvent, Rejected, Twist, TwistPlan
from engine.context import director_context
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
        for twist in await self._store.twists.pending(
            state.world.id, settings.twists_per_tick
        ):
            staged.merge(await self._stage(twist, state))
        return staged

    async def _stage(self, twist: Twist, state: WorldState) -> Staged:
        context = await director_context(self._store, state)
        outcome = await self._plan(twist, context)
        if isinstance(outcome, str):
            await self._store.twists.reject(twist.id, outcome, state.world.tick)
            await self._store.wallets.refund_twist(twist)
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
        staged.add(await self._overrule_vote(twist, context, state))
        return staged

    async def _plan(self, twist: Twist, context: DirectorContext) -> TwistPlan | str:
        try:
            outcome = await self._director.stage(twist, context)
        except Exception:
            logger.exception("director failed on twist %s", twist.id)
            return settings.twist_failed_reason
        return outcome.explanation if isinstance(outcome, Rejected) else outcome

    async def _overrule_vote(
        self, twist: Twist, context: DirectorContext, state: WorldState
    ) -> Event | None:
        poll = context.poll
        if twist.source != "donation" or poll is None:
            return None
        try:
            decided = await self._director.decides_vote(twist, poll)
        except Exception:
            logger.exception("vote check failed on twist %s", twist.id)
            return None
        if not decided:
            return None
        await self._store.polls.cancel(poll.id)
        return await self._store.events.add(
            NewEvent(
                world_id=state.world.id,
                tick=state.world.tick,
                kind="poll_cancelled",
                text=poll.question,
                data={"poll_id": poll.id, "twist_id": twist.id},
            )
        )
