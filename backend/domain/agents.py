from config import DEFAULT_MOOD
from domain.base import Model


class NewAgent(Model):
    world_id: int
    name: str
    persona: str
    location_id: int
    mood: str = DEFAULT_MOOD


class Agent(NewAgent):
    id: int
