from typing import Any

from pydantic import BaseModel, ConfigDict


class Model(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class World(Model):
    id: int
    setting: str
    tick: int


class Location(Model):
    id: int
    world_id: int
    name: str
    description: str


class Agent(Model):
    id: int
    world_id: int
    name: str
    persona: str
    mood: str
    location_id: int


class Relationship(Model):
    """How `from_id` feels about `to_id`. Directional: A→B and B→A are separate."""

    from_id: int
    to_id: int
    affection: int
    trust: int
    note: str


class Event(Model):
    id: int
    world_id: int
    tick: int
    kind: str
    actor_id: int | None
    target_id: int | None
    location_id: int | None
    text: str | None
    data: dict[str, Any]
    witness_ids: list[int]


class Memory(Model):
    id: int
    agent_id: int
    tick: int
    text: str
    event_id: int | None
