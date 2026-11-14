from types import SimpleNamespace

import pytest

from backend.data import Store, connect
from backend.memory import SqlMemoryStore


@pytest.fixture
async def engine(tmp_path):
    engine = await connect(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    yield engine
    await engine.dispose()


@pytest.fixture
def store(engine):
    return Store(engine)


@pytest.fixture
def memory(engine):
    return SqlMemoryStore(engine)


@pytest.fixture
async def villa(store):
    """A world with a pool and a kitchen, Mia and Jake at the pool, Sara in the kitchen."""
    world = await store.create_world("A villa in Bali")
    pool = await store.add_location(world.id, "pool")
    kitchen = await store.add_location(world.id, "kitchen")
    mia = await store.add_agent(world.id, "Mia", "Bold and jealous.", pool.id)
    jake = await store.add_agent(world.id, "Jake", "Charming, can't commit.", pool.id)
    sara = await store.add_agent(
        world.id, "Sara", "Quiet, notices everything.", kitchen.id
    )
    return SimpleNamespace(
        world=world, pool=pool, kitchen=kitchen, mia=mia, jake=jake, sara=sara
    )
