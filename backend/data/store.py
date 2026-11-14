from sqlalchemy.ext.asyncio import AsyncEngine

from data.agents import AgentRepository
from data.chat import ChatRepository
from data.events import EventRepository
from data.locations import LocationRepository
from data.polls import PollRepository
from data.purchases import PurchaseRepository
from data.relationships import RelationshipRepository
from data.twists import TwistRepository
from data.viewers import ViewerRepository
from data.voices import VoiceRepository
from data.wallets import WalletRepository
from data.worlds import WorldRepository


class Store:
    def __init__(self, engine: AsyncEngine) -> None:
        self.worlds = WorldRepository(engine)
        self.locations = LocationRepository(engine)
        self.agents = AgentRepository(engine)
        self.relationships = RelationshipRepository(engine)
        self.events = EventRepository(engine)
        self.twists = TwistRepository(engine)
        self.polls = PollRepository(engine)
        self.viewers = ViewerRepository(engine)
        self.wallets = WalletRepository(engine)
        self.chat = ChatRepository(engine)
        self.voices = VoiceRepository(engine)
        self.purchases = PurchaseRepository(engine)
