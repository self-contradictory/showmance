from typing import Self

from pydantic import Field, model_validator

from config import TWIST_MAX_LENGTH, VIEWER_NAME_MAX_LENGTH
from domain import Agent, Location, Poll, Relationship, Viewer, World
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


class TwistRequest(Model):
    text: str = Field(min_length=1, max_length=TWIST_MAX_LENGTH)


class ViewerRequest(Model):
    name: str = Field(min_length=1, max_length=VIEWER_NAME_MAX_LENGTH)


class ViewerSession(Model):
    viewer: Viewer
    token: str


class PollView(Model):
    poll: Poll
    votes: list[int]


class VoteRequest(Model):
    option: int = Field(ge=0)
