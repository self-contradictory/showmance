import asyncio

from api.stream import follow
from domain import NewEvent


async def test_follow_sends_past_events_then_new_ones(store, villa):
    first = await store.events.add(
        NewEvent(world_id=villa.world.id, tick=1, kind="hug")
    )
    stream = follow(store, villa.world.id, after_id=0)

    assert (await anext(stream)).id == first.id
    second = await store.events.add(
        NewEvent(world_id=villa.world.id, tick=2, kind="kiss")
    )
    async with asyncio.timeout(3):
        assert (await anext(stream)).id == second.id
    await stream.aclose()
