from typing import Self

from pydantic import Field, model_validator

from config import settings
from domain import Agent, Gender, Location, Poll, Relationship, Viewer, World
from domain.base import Model


class LocationSpec(Model):
    name: str
    description: str = ""


class AgentSpec(Model):
    name: str
    persona: str
    gender: Gender
    location: str
    voice: str | None = None


class WorldSpec(Model):
    name: str
    setting: str
    thumbnail_url: str | None = None
    locations: list[LocationSpec]
    agents: list[AgentSpec]

    @model_validator(mode="after")
    def agents_are_in_known_locations(self) -> Self:
        known = {location.name for location in self.locations}
        lost = [agent.name for agent in self.agents if agent.location not in known]
        if lost:
            raise ValueError(f"unknown location for: {', '.join(lost)}")
        return self


class WorldSummary(Model):
    world: World
    running: bool
    viewers: int


class WorldView(Model):
    world: World
    locations: list[Location]
    agents: list[Agent]
    relationships: list[Relationship]
    running: bool
    viewers: int


class TwistRequest(Model):
    text: str = Field(min_length=1, max_length=settings.twist_max_length)


class ViewerRequest(Model):
    name: str = Field(min_length=1, max_length=settings.viewer_name_max_length)


class ViewerSession(Model):
    viewer: Viewer
    token: str


class PollView(Model):
    poll: Poll
    votes: list[int]


class VoteRequest(Model):
    option: int = Field(ge=0)


class ChatRequest(Model):
    text: str = Field(min_length=1, max_length=settings.chat_max_length)
