from sqlalchemy.ext.asyncio import AsyncEngine

from data.agents import AgentRepository
from data.events import EventRepository
from data.locations import LocationRepository
from data.relationships import RelationshipRepository
from data.twists import TwistRepository
from data.worlds import WorldRepository


class Store:
    def __init__(self, engine: AsyncEngine) -> None:
        self.worlds = WorldRepository(engine)
        self.locations = LocationRepository(engine)
        self.agents = AgentRepository(engine)
        self.relationships = RelationshipRepository(engine)
        self.events = EventRepository(engine)
        self.twists = TwistRepository(engine)
