from pydantic import Field

from config import MAX_FEELING_CHANGE
from domain.base import Model


class FeelingChange(Model):
    to_id: int
    affection_change: int = Field(ge=-MAX_FEELING_CHANGE, le=MAX_FEELING_CHANGE)
    trust_change: int = Field(ge=-MAX_FEELING_CHANGE, le=MAX_FEELING_CHANGE)
    note: str


class Reaction(Model):
    mood: str
    memory: str
    changes: list[FeelingChange]
