async def test_agents_only_recall_what_they_witnessed(store, memory, villa):
    v = villa

    hug = await store.add_event(
        v.world.id,
        1,
        "hug",
        actor_id=v.jake.id,
        target_id=v.mia.id,
        location_id=v.pool.id,
        witness_ids=[v.mia.id, v.jake.id],
    )
    for agent_id in hug.witness_ids:
        await memory.remember(
            agent_id, "Jake hugged Mia at the pool", tick=1, event_id=hug.id
        )

    [seen] = await memory.recall(v.mia.id, "at the pool")
    assert (seen.text, seen.event_id) == ("Jake hugged Mia at the pool", hug.id)
    assert await memory.recall(v.sara.id, "at the pool") == []  # was in the kitchen


async def test_recall_returns_latest_oldest_first(memory, villa):
    for tick in range(5):
        await memory.remember(villa.mia.id, f"moment {tick}", tick=tick)

    recalled = await memory.recall(villa.mia.id, "", limit=3)
    assert [m.text for m in recalled] == ["moment 2", "moment 3", "moment 4"]
