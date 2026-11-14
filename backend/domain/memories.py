from domain.base import Model


class NewMemory(Model):
    agent_id: int
    tick: int
    text: str
    event_id: int | None = None


class Memory(NewMemory):
    id: int
