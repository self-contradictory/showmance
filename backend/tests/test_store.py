async def test_world_state_updates(store, villa):
    v = villa

    await store.move_agent(v.mia.id, v.kitchen.id)
    await store.set_mood(v.mia.id, "angry")
    assert await store.advance_tick(v.world.id) == 1

    agents = {a.name: a for a in await store.get_agents(v.world.id)}
    assert (agents["Mia"].location_id, agents["Mia"].mood) == (v.kitchen.id, "angry")
    assert agents["Jake"].location_id == v.pool.id
    assert (await store.get_world(v.world.id)).tick == 1
    locations = await store.get_locations(v.world.id)
    assert {loc.name for loc in locations} == {"pool", "kitchen"}


async def test_relationships_are_directional_and_clamped(store, villa):
    v = villa

    rel = await store.adjust_relationship(
        v.mia.id, v.jake.id, affection=10, trust=-5, note="cute"
    )
    assert (rel.affection, rel.trust, rel.note) == (60, 45, "cute")

    rel = await store.adjust_relationship(v.mia.id, v.jake.id, affection=999)
    assert (rel.affection, rel.note) == (100, "cute")

    # Jake→Mia was never touched, so only Mia→Jake exists
    rels = await store.get_relationships(v.world.id)
    assert [(r.from_id, r.to_id) for r in rels] == [(v.mia.id, v.jake.id)]


async def test_relationships_stay_in_their_world(store, villa):
    other = await store.create_world("Another villa")
    room = await store.add_location(other.id, "room")
    a = await store.add_agent(other.id, "A", "", room.id)
    b = await store.add_agent(other.id, "B", "", room.id)
    await store.adjust_relationship(a.id, b.id, affection=5)

    assert await store.get_relationships(villa.world.id) == []
    assert len(await store.get_relationships(other.id)) == 1


async def test_events_come_back_in_order(store, villa):
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
    say = await store.add_event(
        v.world.id,
        1,
        "say",
        actor_id=v.mia.id,
        location_id=v.pool.id,
        text="Again?",
        data={"emotion": "happy"},
    )

    assert [e.id for e in await store.get_events(v.world.id)] == [hug.id, say.id]
    [newer] = await store.get_events(v.world.id, after_id=hug.id)
    assert (newer.text, newer.data) == ("Again?", {"emotion": "happy"})
    assert hug.witness_ids == [v.mia.id, v.jake.id]
