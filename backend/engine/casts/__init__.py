from ai import Roles
from config import CastKind
from data import Store
from engine.casts.agents import AgentsCast
from engine.casts.base import Cast
from engine.casts.writer import WriterCast
from memory import MemoryStore


def build_cast(kind: CastKind, roles: Roles, store: Store, memory: MemoryStore) -> Cast:
    if kind == "writer":
        return WriterCast(store, roles.writer)
    return AgentsCast(memory, roles.decider, roles.appraiser)


__all__ = ["AgentsCast", "Cast", "WriterCast", "build_cast"]
