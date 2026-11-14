from typing import Any

from pydantic import Field

from domain.base import Model


class NewEvent(Model):
    world_id: int
    tick: int
    kind: str
    actor_id: int | None = None
    target_id: int | None = None
    location_id: int | None = None
    text: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)
    witness_ids: list[int] = Field(default_factory=list)


class Event(NewEvent):
    id: int
