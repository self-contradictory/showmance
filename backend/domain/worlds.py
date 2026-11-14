from pydantic import computed_field

from config import settings
from domain.base import Model


class NewWorld(Model):
    name: str
    setting: str
    thumbnail_url: str | None = None
    home: str | None = None


class World(NewWorld):
    id: int
    tick: int

    @computed_field
    @property
    def day(self) -> int:
        return self.tick // settings.ticks_per_day + 1
