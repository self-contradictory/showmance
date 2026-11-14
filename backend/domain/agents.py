from config import settings
from domain.base import Model


class NewAgent(Model):
    world_id: int
    name: str
    persona: str
    location_id: int
    mood: str = settings.default_mood


class Agent(NewAgent):
    id: int
