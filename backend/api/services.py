from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncEngine

from ai import llm_roles
from api.runners import Runners
from data import Store
from engine import Engine
from engine.casts import AgentsCast
from memory import SqlMemoryStore


@dataclass
class Services:
    store: Store
    engine: Engine
    runners: Runners


def build_services(db: AsyncEngine) -> Services:
    store = Store(db)
    memory = SqlMemoryStore(db)
    roles = llm_roles()
    cast = AgentsCast(memory, roles.decider, roles.appraiser)
    engine = Engine(store, memory, roles.director, cast)
    return Services(store=store, engine=engine, runners=Runners(engine))
