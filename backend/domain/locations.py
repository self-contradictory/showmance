from domain.base import Model


class NewLocation(Model):
    world_id: int
    name: str
    description: str = ""


class Location(NewLocation):
    id: int
