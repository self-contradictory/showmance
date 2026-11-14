import asyncio

from api.presence import Presence
from api.stream import watch
from domain import NewChatMessage, NewEvent


async def test_stream_sends_events_viewers_and_new_chat(store, villa):
    world_id = villa.world.id
    viewer, _ = await store.viewers.create("Ann")

    def chat(text):
        return NewChatMessage(
            world_id=world_id, viewer_id=viewer.id, name="Ann", text=text
        )

    presence = Presence()
    hug = await store.events.add(NewEvent(world_id=world_id, tick=1, kind="hug"))
    await store.chat.add(chat("sent before I joined"))
    stream = watch(store, presence, world_id, after_id=0)

    event = await anext(stream)
    viewers = await anext(stream)
    await store.chat.add(chat("go Mia!"))
    async with asyncio.timeout(3):
        message = await anext(stream)

    assert (event.id, event.event, event.data.id) == (str(hug.id), None, hug.id)
    assert (viewers.event, viewers.data) == ("viewers", 1)
    assert (message.event, message.data.text) == ("chat", "go Mia!")
    await stream.aclose()
    assert presence.count(world_id) == 0


async def test_follow_on_reconnect_skips_seen_events(store, villa):
    world_id = villa.world.id
    first = await store.events.add(NewEvent(world_id=world_id, tick=1, kind="hug"))
    second = await store.events.add(NewEvent(world_id=world_id, tick=2, kind="kiss"))
    stream = watch(store, Presence(), world_id, after_id=first.id)

    event = await anext(stream)

    assert event.id == str(second.id)
    await stream.aclose()
