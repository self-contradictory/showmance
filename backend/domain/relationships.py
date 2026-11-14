from domain.base import Model


class Relationship(Model):
    from_id: int
    to_id: int
    affection: int
    trust: int
    note: str


class RelationshipChange(Model):
    from_id: int
    to_id: int
    affection: int = 0
    trust: int = 0
    note: str | None = None
