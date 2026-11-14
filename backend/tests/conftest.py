from types import SimpleNamespace

import pytest

from data import Store, connect
from domain import NewAgent, NewLocation
from memory import SqlMemoryStore


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
    world = await store.worlds.create("A villa in Bali")
    pool = await store.locations.add(NewLocation(world_id=world.id, name="pool"))
    kitchen = await store.locations.add(NewLocation(world_id=world.id, name="kitchen"))

    async def agent(name, location):
        return await store.agents.add(
            NewAgent(world_id=world.id, name=name, persona="", location_id=location.id)
        )

    return SimpleNamespace(
        world=world,
        pool=pool,
        kitchen=kitchen,
        mia=await agent("Mia", pool),
        jake=await agent("Jake", pool),
        sara=await agent("Sara", kitchen),
    )
