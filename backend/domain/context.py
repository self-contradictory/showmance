from domain.agents import Agent
from domain.base import Model
from domain.locations import Location
from domain.memories import Memory
from domain.relationships import Relationship
from domain.worlds import World


class AgentContext(Model):
    world: World
    agent: Agent
    others: list[Agent]
    locations: list[Location]
    relationships: list[Relationship]
    memories: list[Memory]
