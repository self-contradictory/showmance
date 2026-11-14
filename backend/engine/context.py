from collections.abc import Sequence

from config import DIRECTOR_EVENT_LIMIT
from data import Store
from domain import Agent, AgentContext, DirectorContext
from engine.state import WorldState
from memory import MemoryStore


class ContextBuilder:
    def __init__(self, memory: MemoryStore) -> None:
        self._memory = memory

    async def build(
        self, agent: Agent, state: WorldState, directions: Sequence[str] = ()
    ) -> AgentContext:
        return AgentContext(
            world=state.world,
            agent=agent,
            others=[a for a in state.agents if a.id != agent.id],
            locations=state.locations,
            relationships=[r for r in state.relationships if r.from_id == agent.id],
            memories=await self._memory.recall(agent.id, _situation(agent, state)),
            directions=list(directions),
        )


def _situation(agent: Agent, state: WorldState) -> str:
    place = state.location(agent.location_id).name
    people = [a.name for a in state.at(agent.location_id) if a.id != agent.id]
    return f"{place}, with {', '.join(people) or 'nobody'}"


async def director_context(store: Store, state: WorldState) -> DirectorContext:
    return DirectorContext(
        world=state.world,
        agents=state.agents,
        locations=state.locations,
        relationships=state.relationships,
        events=await store.events.recent(state.world.id, DIRECTOR_EVENT_LIMIT),
        poll=await store.polls.current(state.world.id),
    )
