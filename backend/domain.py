from typing import Any

from pydantic import BaseModel, ConfigDict

from config import DEFAULT_MOOD


class Model(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class World(Model):
    id: int
    setting: str
    tick: int


class NewLocation(Model):
    world_id: int
    name: str
    description: str = ""


class Location(NewLocation):
    id: int


class NewAgent(Model):
    world_id: int
    name: str
    persona: str
    location_id: int
    mood: str = DEFAULT_MOOD


class Agent(NewAgent):
    id: int


class Relationship(Model):
    from_id: int
    to_id: int
    affection: int
    trust: int
    note: str


class RelationshipChange(Model):
    from_id: int
    to_id: int
    affection: int = 0
    trust: int = 0
    note: str | None = None


class NewEvent(Model):
    world_id: int
    tick: int
    kind: str
    actor_id: int | None = None
    target_id: int | None = None
    location_id: int | None = None
    text: str | None = None
    data: dict[str, Any] = {}
    witness_ids: list[int] = []


class Event(NewEvent):
    id: int


class NewMemory(Model):
    agent_id: int
    tick: int
    text: str
    event_id: int | None = None


class Memory(NewMemory):
    id: int
