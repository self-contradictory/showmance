from data import Store
from domain import Agent, NewMemory, Reaction, RelationshipChange
from engine.rules import can_feel
from engine.state import WorldState
from memory import MemoryStore


class Reactions:
    def __init__(self, store: Store, memory: MemoryStore) -> None:
        self._store = store
        self._memory = memory

    async def apply(self, reaction: Reaction, agent: Agent, state: WorldState) -> None:
        await self._memory.remember(
            NewMemory(agent_id=agent.id, tick=state.world.tick, text=reaction.memory)
        )
        await self._store.agents.set_mood(agent.id, reaction.mood)
        for change in reaction.changes:
            if can_feel(change, agent, state):
                await self._store.relationships.adjust(
                    RelationshipChange(
                        from_id=agent.id,
                        to_id=change.to_id,
                        affection=change.affection_change,
                        trust=change.trust_change,
                        note=change.note,
                    )
                )
