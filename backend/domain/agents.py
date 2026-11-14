from typing import Literal

from config import settings
from domain.base import Model

Gender = Literal["female", "male"]


class NewAgent(Model):
    world_id: int
    name: str
    persona: str
    location_id: int
    mood: str = settings.default_mood
    gender: Gender | None = None


class Agent(NewAgent):
    id: int
