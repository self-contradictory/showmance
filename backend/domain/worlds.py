from domain.base import Model


class World(Model):
    id: int
    setting: str
    tick: int
