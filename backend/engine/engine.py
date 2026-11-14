import asyncio
import random

from ai import Appraiser, Decider
from data import Store
from domain import Action, Event, NewEvent
from engine.context import ContextBuilder
from engine.effects import Effects
from engine.events import to_event
from engine.parallel import settle
from engine.reactions import Reactions
from engine.rules import takes_effect
from engine.state import WorldState, load_state
from memory import MemoryStore


class Engine:
    def __init__(
        self,
        store: Store,
        memory: MemoryStore,
        decider: Decider,
        appraiser: Appraiser,
    ) -> None:
        self._store = store
        self._decider = decider
        self._appraiser = appraiser
        self._contexts = ContextBuilder(memory)
        self._effects = Effects(store)
        self._reactions = Reactions(store, memory)
        self._lock = asyncio.Lock()

    async def step(self, world_id: int) -> list[Event]:
        async with self._lock:
            await self._store.worlds.advance_tick(world_id)
            state = await load_state(self._store, world_id)
            decisions = await self._decide(state)
            events = await self._resolve(decisions, state)
            await self._react(events, state)
            return events

    async def inject(self, event: NewEvent) -> Event:
        async with self._lock:
            saved = await self._store.events.add(event)
            await self._react([saved], await load_state(self._store, event.world_id))
            return saved

    async def _decide(self, state: WorldState) -> dict[int, Action]:
        contexts = await asyncio.gather(
            *(self._contexts.build(agent, state) for agent in state.agents)
        )
        return await settle({c.agent.id: self._decider.decide(c) for c in contexts})

    async def _resolve(
        self, decisions: dict[int, Action], state: WorldState
    ) -> list[Event]:
        order = list(decisions.items())
        random.shuffle(order)
        events = []
        for agent_id, action in order:
            actor = state.agent(agent_id)
            if takes_effect(action, actor, state):
                events.append(
                    await self._store.events.add(to_event(action, actor, state))
                )
                await self._effects.apply(action, actor, state)
        return events

    async def _react(self, events: list[Event], state: WorldState) -> None:
        seen = {
            a.id: [e for e in events if a.id in e.witness_ids] for a in state.agents
        }
        witnesses = [agent for agent in state.agents if seen[agent.id]]
        contexts = await asyncio.gather(
            *(self._contexts.build(agent, state) for agent in witnesses)
        )
        reactions = await settle(
            {
                c.agent.id: self._appraiser.appraise(c, seen[c.agent.id])
                for c in contexts
            }
        )
        for agent_id, reaction in reactions.items():
            await self._reactions.apply(reaction, state.agent(agent_id), state)
