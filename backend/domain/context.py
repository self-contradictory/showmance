from pydantic import Field

from domain.agents import Agent
from domain.base import Model
from domain.events import Event
from domain.locations import Location
from domain.memories import Memory
from domain.polls import Poll
from domain.relationships import Relationship
from domain.worlds import World


class AgentContext(Model):
    world: World
    agent: Agent
    others: list[Agent]
    locations: list[Location]
    relationships: list[Relationship]
    memories: list[Memory]
    directions: list[str] = Field(default_factory=list)


class DirectorContext(Model):
    world: World
    agents: list[Agent]
    locations: list[Location]
    relationships: list[Relationship]
    events: list[Event]
    poll: Poll | None = None
