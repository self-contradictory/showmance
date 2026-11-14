from domain import NewEvent


async def test_events_come_back_in_order(store, villa):
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
    say = await store.events.add(
        NewEvent(
            world_id=v.world.id,
            tick=1,
            kind="say",
            actor_id=v.mia.id,
            location_id=v.pool.id,
            text="Again?",
            data={"emotion": "happy"},
        )
    )

    assert [e.id for e in await store.events.get_all(v.world.id)] == [hug.id, say.id]
    [newer] = await store.events.get_all(v.world.id, after_id=hug.id)
    assert (newer.text, newer.data) == ("Again?", {"emotion": "happy"})
    assert hug.witness_ids == [v.mia.id, v.jake.id]
