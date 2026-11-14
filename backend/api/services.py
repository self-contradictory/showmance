from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncEngine

from ai import llm_roles
from api.presence import Presence
from api.runners import Runners
from config import settings
from data import Store
from engine import Engine
from engine.casts import build_cast
from memory import SqlMemoryStore
from payments import Payments, build_payments
from voice import AudioCache, Narrator, build_voice


@dataclass
class Services:
    store: Store
    engine: Engine
    runners: Runners
    narrator: Narrator
    presence: Presence = field(default_factory=Presence)
    payments: Payments | None = None


def build_services(db: AsyncEngine) -> Services:
    store = Store(db)
    memory = SqlMemoryStore(db)
    roles = llm_roles()
    cast = build_cast(settings.cast, roles, store, memory)
    engine = Engine(store, memory, roles.director, cast)
    narrator = Narrator(
        store, build_voice(settings.tts), AudioCache(settings.audio_dir)
    )
    return Services(
        store=store,
        engine=engine,
        runners=Runners(engine),
        narrator=narrator,
        payments=build_payments(settings.stripe_secret_key),
    )
