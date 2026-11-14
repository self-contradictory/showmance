from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncEngine

from ai import LlmAppraiser, LlmDecider
from api.runners import Runners
from data import Store
from engine import Engine
from memory import SqlMemoryStore


@dataclass
class Services:
    store: Store
    engine: Engine
    runners: Runners


def build_services(db: AsyncEngine) -> Services:
    store = Store(db)
    engine = Engine(store, SqlMemoryStore(db), LlmDecider(), LlmAppraiser())
    return Services(store=store, engine=engine, runners=Runners(engine))
