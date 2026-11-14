import asyncio
import random

from ai import Appraiser, Decider
from domain import Action, Event, Reaction
from engine.casts.base import Cast
from engine.context import ContextBuilder
from engine.parallel import settle
from engine.state import WorldState
from memory import MemoryStore


class AgentsCast(Cast):
    def __init__(
        self, memory: MemoryStore, decider: Decider, appraiser: Appraiser
    ) -> None:
        self._contexts = ContextBuilder(memory)
        self._decider = decider
        self._appraiser = appraiser

    async def act(
        self, state: WorldState, directions: dict[int, list[str]]
    ) -> dict[int, Action]:
        contexts = await asyncio.gather(
            *(
                self._contexts.build(agent, state, directions.get(agent.id, []))
                for agent in state.agents
            )
        )
        decisions = await settle(
            {c.agent.id: self._decider.decide(c) for c in contexts}
        )
        order = list(decisions.items())
        random.shuffle(order)
        return dict(order)

    async def react(
        self, state: WorldState, seen: dict[int, list[Event]]
    ) -> dict[int, Reaction]:
        contexts = await asyncio.gather(
            *(self._contexts.build(state.agent(agent_id), state) for agent_id in seen)
        )
        return await settle(
            {
                c.agent.id: self._appraiser.appraise(c, seen[c.agent.id])
                for c in contexts
            }
        )

    def replan(self, world_id: int) -> None:
        pass
