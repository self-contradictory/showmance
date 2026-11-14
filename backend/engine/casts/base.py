from typing import Protocol

from domain import Action, Event, Reaction
from engine.state import WorldState


class Cast(Protocol):
    async def act(
        self, state: WorldState, directions: dict[int, list[str]]
    ) -> dict[int, Action]: ...

    async def react(
        self, state: WorldState, seen: dict[int, list[Event]]
    ) -> dict[int, Reaction]: ...

    def replan(self, world_id: int) -> None: ...
