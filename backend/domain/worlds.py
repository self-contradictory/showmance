from domain.base import Model


class NewWorld(Model):
    name: str
    setting: str
    thumbnail_url: str | None = None


class World(NewWorld):
    id: int
    tick: int
