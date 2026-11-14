from sqlalchemy import text

from data import Store, connect
from domain import NewAgent, NewLocation, NewWorld


async def test_new_columns_are_added_to_an_existing_database(tmp_path):
    url = f"sqlite+aiosqlite:///{tmp_path / 'old.db'}"
    old = await connect(url)
    async with old.begin() as conn:
        await conn.execute(text("ALTER TABLE agents DROP COLUMN gender"))
    store = Store(old)
    world = await store.worlds.create(NewWorld(name="Villa", setting=""))
    pool = await store.locations.add(NewLocation(world_id=world.id, name="pool"))
    async with old.begin() as conn:
        await conn.execute(
            text(
                "INSERT INTO agents (world_id, name, persona, mood, location_id) "
                f"VALUES ({world.id}, 'Mia', '', 'neutral', {pool.id})"
            )
        )
    await old.dispose()

    db = await connect(url)
    store = Store(db)
    await store.agents.add(
        NewAgent(
            world_id=world.id,
            name="Jake",
            persona="",
            gender="male",
            location_id=pool.id,
        )
    )
    genders = {a.name: a.gender for a in await store.agents.get_all(world.id)}
    await db.dispose()

    assert genders == {"Mia": None, "Jake": "male"}
