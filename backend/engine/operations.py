from dataclasses import dataclass, field
from typing import Any

from data import Store
from domain import (
    Announce,
    Arrive,
    Event,
    NewAgent,
    NewEvent,
    Nudge,
    Relocate,
    Reveal,
    Twist,
    TwistPlan,
)
from engine.state import WorldState


@dataclass
class Staged:
    events: list[Event] = field(default_factory=list)
    directions: dict[int, list[str]] = field(default_factory=dict)

    def add(self, event: Event | None) -> None:
        if event is not None:
            self.events.append(event)

    def direct(self, agent_id: int, instruction: str) -> None:
        self.directions.setdefault(agent_id, []).append(instruction)

    def merge(self, other: Staged) -> None:
        self.events.extend(other.events)
        for agent_id, instructions in other.directions.items():
            for instruction in instructions:
                self.direct(agent_id, instruction)


class Operations:
    def __init__(self, store: Store) -> None:
        self._store = store

    async def apply(self, plan: TwistPlan, twist: Twist, state: WorldState) -> Staged:
        staged = Staged()
        for arrival in plan.arrivals:
            staged.add(await self._arrive(arrival, twist, state))
        for relocation in plan.relocations:
            staged.add(await self._relocate(relocation, twist, state))
        for reveal in plan.reveals:
            staged.add(await self._reveal(reveal, twist, state))
        for announcement in plan.announcements:
            staged.add(await self._announce(announcement, twist, state))
        for nudge in plan.nudges:
            staged.add(await self._nudge(nudge, twist, state))
        for perform in plan.performs:
            if state.has_agent(perform.agent_id):
                staged.direct(perform.agent_id, perform.instruction)
        return staged

    async def _arrive(
        self, op: Arrive, twist: Twist, state: WorldState
    ) -> Event | None:
        taken = any(a.name == op.name for a in state.agents)
        if taken or not state.has_location(op.location_id):
            return None
        agent = await self._store.agents.add(
            NewAgent(
                world_id=state.world.id,
                name=op.name,
                persona=op.persona,
                gender=op.gender,
                location_id=op.location_id,
            )
        )
        state.agents.append(agent)
        return await self._record(
            twist,
            state,
            kind="arrive",
            actor_id=agent.id,
            location_id=agent.location_id,
            witness_ids=_present(state, agent.location_id),
        )

    async def _relocate(
        self, op: Relocate, twist: Twist, state: WorldState
    ) -> Event | None:
        if not (state.has_agent(op.agent_id) and state.has_location(op.destination_id)):
            return None
        origin = state.agent(op.agent_id).location_id
        if origin == op.destination_id:
            return None
        event = await self._record(
            twist,
            state,
            kind="relocate",
            target_id=op.agent_id,
            location_id=origin,
            witness_ids=_present(state, origin),
            data={"destination_id": op.destination_id},
        )
        await self._store.agents.move(op.agent_id, op.destination_id)
        state.move(op.agent_id, op.destination_id)
        return event

    async def _reveal(
        self, op: Reveal, twist: Twist, state: WorldState
    ) -> Event | None:
        to = [agent_id for agent_id in op.to_ids if state.has_agent(agent_id)]
        if not to:
            return None
        return await self._record(
            twist, state, kind="reveal", text=op.text, witness_ids=to
        )

    async def _announce(self, op: Announce, twist: Twist, state: WorldState) -> Event:
        return await self._record(
            twist,
            state,
            kind="announce",
            text=op.text,
            witness_ids=[a.id for a in state.agents],
        )

    async def _nudge(self, op: Nudge, twist: Twist, state: WorldState) -> Event | None:
        if not state.has_agent(op.agent_id):
            return None
        return await self._record(
            twist,
            state,
            kind="nudge",
            target_id=op.agent_id,
            text=op.text,
            witness_ids=[op.agent_id],
        )

    async def _record(self, twist: Twist, state: WorldState, **fields: Any) -> Event:
        data = {"twist_id": twist.id, **fields.pop("data", {})}
        return await self._store.events.add(
            NewEvent(
                world_id=state.world.id, tick=state.world.tick, data=data, **fields
            )
        )


def _present(state: WorldState, location_id: int) -> list[int]:
    return [a.id for a in state.at(location_id)]
