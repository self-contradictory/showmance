from ai import Roles
from config import CastKind, settings
from data import Store
from engine.casts.agents import AgentsCast
from engine.casts.base import Cast
from engine.casts.pacing import Pacing, Parallel, Sequential, build_pacing
from engine.casts.writer import WriterCast
from memory import MemoryStore


def build_cast(kind: CastKind, roles: Roles, store: Store, memory: MemoryStore) -> Cast:
    if kind == "writer":
        return WriterCast(store, roles.writer, build_pacing(settings.pacing))
    return AgentsCast(memory, roles.decider, roles.appraiser)


__all__ = [
    "AgentsCast",
    "Cast",
    "Pacing",
    "Parallel",
    "Sequential",
    "WriterCast",
    "build_cast",
    "build_pacing",
]
