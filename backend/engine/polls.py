import logging
import random
from typing import get_args

from ai import Director
from config import settings
from data import Store
from domain import (
    OPTION_COUNTS,
    YES_NO_LABELS,
    Event,
    NewEvent,
    NewPoll,
    NewTwist,
    PollFormat,
    Proposal,
)
from engine.context import director_context
from engine.state import WorldState, load_state

logger = logging.getLogger(__name__)


class Polling:
    def __init__(self, store: Store, director: Director) -> None:
        self._store = store
        self._director = director

    async def close_due(self, state: WorldState) -> list[Event]:
        poll = await self._store.polls.current(state.world.id)
        if poll is None or state.world.tick < poll.closes_tick:
            return []
        winner = _winner(await self._store.polls.tally(poll))
        await self._store.polls.close(poll.id, winner)
        option = poll.options[winner]
        await self._store.twists.add(
            NewTwist(
                world_id=state.world.id,
                text=option.twist,
                source="vote",
                poll_id=poll.id,
            )
        )
        closed = await self._store.events.add(
            NewEvent(
                world_id=state.world.id,
                tick=state.world.tick,
                kind="poll_closed",
                text=option.label,
                data={"poll_id": poll.id, "winner": winner},
            )
        )
        return [closed]

    async def open_next(self, world_id: int) -> list[Event]:
        if await self._store.polls.current(world_id) is not None:
            return []
        state = await load_state(self._store, world_id)
        poll_format: PollFormat = random.choice(get_args(PollFormat))
        proposal = await self._propose(state, poll_format)
        if proposal is None:
            return []
        poll = await self._store.polls.open(
            NewPoll(
                world_id=world_id,
                question=proposal.question,
                options=proposal.options,
                opened_tick=state.world.tick,
                closes_tick=state.world.tick + settings.poll_ticks,
            )
        )
        opened = await self._store.events.add(
            NewEvent(
                world_id=world_id,
                tick=state.world.tick,
                kind="poll_opened",
                text=poll.question,
                data={"poll_id": poll.id},
            )
        )
        return [opened]

    async def _propose(
        self, state: WorldState, poll_format: PollFormat
    ) -> Proposal | None:
        context = await director_context(self._store, state)
        try:
            proposal = await self._director.propose(context, poll_format)
        except Exception:
            logger.exception("director failed to propose a poll")
            return None
        if len(proposal.options) != OPTION_COUNTS[poll_format]:
            logger.warning("proposal for %s had wrong option count", poll_format)
            return None
        if poll_format == "yes_no":
            labeled = [
                option.model_copy(update={"label": label})
                for option, label in zip(proposal.options, YES_NO_LABELS, strict=True)
            ]
            return proposal.model_copy(update={"options": labeled})
        return proposal


def _winner(votes: list[int]) -> int:
    top = max(votes)
    return random.choice([index for index, count in enumerate(votes) if count == top])
