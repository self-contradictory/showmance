async def test_world_state_updates(store, villa):
    v = villa

    await store.agents.move(v.mia.id, v.kitchen.id)
    await store.agents.set_mood(v.mia.id, "angry")
    assert await store.worlds.advance_tick(v.world.id) == 1

    agents = {a.name: a for a in await store.agents.get_all(v.world.id)}
    assert (agents["Mia"].location_id, agents["Mia"].mood) == (v.kitchen.id, "angry")
    assert agents["Jake"].location_id == v.pool.id
    assert (await store.worlds.get(v.world.id)).tick == 1
    locations = await store.locations.get_all(v.world.id)
    assert {loc.name for loc in locations} == {"pool", "kitchen"}
