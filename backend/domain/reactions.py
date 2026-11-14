from pydantic import Field

from config import settings
from domain.base import Model


class FeelingChange(Model):
    to_id: int
    affection_change: int = Field(
        ge=-settings.max_feeling_change, le=settings.max_feeling_change
    )
    trust_change: int = Field(
        ge=-settings.max_feeling_change, le=settings.max_feeling_change
    )
    note: str


class Reaction(Model):
    mood: str
    memory: str
    changes: list[FeelingChange]
