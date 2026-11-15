from domain import NewEvent, Say


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


async def test_history_can_be_just_the_latest_events(villa, sim, client):
    s = sim({"Mia": Say(text="Hi", emotion="happy")})
    for _ in range(3):
        await s.engine.step(villa.world.id)

    async with client(s.engine) as http:
        latest = (await http.get(f"/worlds/{villa.world.id}/events?last=2")).json()
        everything = (await http.get(f"/worlds/{villa.world.id}/events")).json()

    assert len(everything) == 3
    assert [e["id"] for e in latest] == [e["id"] for e in everything[-2:]]
