from domain import Agent, AgentContext
from engine.state import WorldState
from memory import MemoryStore


class ContextBuilder:
    def __init__(self, memory: MemoryStore) -> None:
        self._memory = memory

    async def build(self, agent: Agent, state: WorldState) -> AgentContext:
        return AgentContext(
            world=state.world,
            agent=agent,
            others=[a for a in state.agents if a.id != agent.id],
            locations=state.locations,
            relationships=[r for r in state.relationships if r.from_id == agent.id],
            memories=await self._memory.recall(agent.id, _situation(agent, state)),
        )


def _situation(agent: Agent, state: WorldState) -> str:
    place = state.location(agent.location_id).name
    people = [a.name for a in state.at(agent.location_id) if a.id != agent.id]
    return f"{place}, with {', '.join(people) or 'nobody'}"
