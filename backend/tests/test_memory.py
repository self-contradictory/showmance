from domain import NewEvent, NewMemory


async def test_agents_only_recall_what_they_witnessed(store, memory, villa):
    v = villa

    hug = await store.events.add(
        NewEvent(
            world_id=v.world.id,
            tick=1,
            kind="hug",
            actor_id=v.jake.id,
            target_id=v.mia.id,
            location_id=v.pool.id,
            witness_ids=[v.mia.id, v.jake.id],
        )
    )
    for agent_id in hug.witness_ids:
        await memory.remember(
            NewMemory(
                agent_id=agent_id,
                tick=1,
                text="Jake hugged Mia at the pool",
                event_id=hug.id,
            )
        )

    [seen] = await memory.recall(v.mia.id, "at the pool")
    assert (seen.text, seen.event_id) == ("Jake hugged Mia at the pool", hug.id)
    assert await memory.recall(v.sara.id, "at the pool") == []


async def test_recall_returns_latest_oldest_first(memory, villa):
    for tick in range(5):
        await memory.remember(
            NewMemory(agent_id=villa.mia.id, tick=tick, text=f"moment {tick}")
        )

    recalled = await memory.recall(villa.mia.id, "", limit=3)
    assert [m.text for m in recalled] == ["moment 2", "moment 3", "moment 4"]
