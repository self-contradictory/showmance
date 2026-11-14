from config import MAX_SCORE, NEUTRAL_SCORE
from domain import NewAgent, NewLocation, RelationshipChange


async def test_relationships_are_directional_and_clamped(store, villa):
    v = villa

    rel = await store.relationships.adjust(
        RelationshipChange(
            from_id=v.mia.id, to_id=v.jake.id, affection=10, trust=-5, note="cute"
        )
    )
    assert (rel.affection, rel.trust, rel.note) == (
        NEUTRAL_SCORE + 10,
        NEUTRAL_SCORE - 5,
        "cute",
    )

    rel = await store.relationships.adjust(
        RelationshipChange(from_id=v.mia.id, to_id=v.jake.id, affection=999)
    )
    assert (rel.affection, rel.note) == (MAX_SCORE, "cute")

    rels = await store.relationships.get_all(v.world.id)
    assert [(r.from_id, r.to_id) for r in rels] == [(v.mia.id, v.jake.id)]


async def test_relationships_stay_in_their_world(store, villa):
    other = await store.worlds.create("Another villa")
    room = await store.locations.add(NewLocation(world_id=other.id, name="room"))
    a, b = [
        await store.agents.add(
            NewAgent(world_id=other.id, name=name, persona="", location_id=room.id)
        )
        for name in ("A", "B")
    ]
    await store.relationships.adjust(
        RelationshipChange(from_id=a.id, to_id=b.id, affection=5)
    )

    assert await store.relationships.get_all(villa.world.id) == []
    assert len(await store.relationships.get_all(other.id)) == 1
