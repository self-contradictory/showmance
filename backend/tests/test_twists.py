import pytest

from data import NotFound
from domain import NewTwist


async def test_twists_wait_in_order_until_resolved(store, villa):
    world_id = villa.world.id
    first = await store.twists.add(
        NewTwist(world_id=world_id, text="first", source="vote")
    )
    second = await store.twists.add(
        NewTwist(world_id=world_id, text="second", source="vote")
    )
    third = await store.twists.add(
        NewTwist(world_id=world_id, text="third", source="vote")
    )

    assert [t.id for t in await store.twists.pending(world_id, 2)] == [
        first.id,
        second.id,
    ]

    await store.twists.stage(first.id, "it happened", 4)
    await store.twists.reject(second.id, "not possible", 4)

    assert [t.id for t in await store.twists.pending(world_id, 10)] == [third.id]
    staged = await store.twists.get(first.id)
    rejected = await store.twists.get(second.id)
    assert (staged.status, staged.outcome, staged.tick) == ("staged", "it happened", 4)
    assert (rejected.status, rejected.outcome) == ("rejected", "not possible")


async def test_missing_twist_is_not_found(store):
    with pytest.raises(NotFound):
        await store.twists.get(999)
