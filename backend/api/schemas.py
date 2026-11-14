from typing import Self

from pydantic import model_validator

from domain import Agent, Location, Relationship, World
from domain.base import Model


class LocationSpec(Model):
    name: str
    description: str = ""


class AgentSpec(Model):
    name: str
    persona: str
    location: str


class WorldSpec(Model):
    setting: str
    locations: list[LocationSpec]
    agents: list[AgentSpec]

    @model_validator(mode="after")
    def agents_are_in_known_locations(self) -> Self:
        known = {location.name for location in self.locations}
        lost = [agent.name for agent in self.agents if agent.location not in known]
        if lost:
            raise ValueError(f"unknown location for: {', '.join(lost)}")
        return self


class WorldView(Model):
    world: World
    locations: list[Location]
    agents: list[Agent]
    relationships: list[Relationship]
    running: bool


class Twist(Model):
    kind: str
    text: str
    witness_ids: list[int]
    target_id: int | None = None
