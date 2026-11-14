import asyncio
from collections.abc import AsyncGenerator

from fastapi.sse import ServerSentEvent

from api.presence import Presence
from config import settings
from data import Store


async def watch(
    store: Store, presence: Presence, world_id: int, after_id: int
) -> AsyncGenerator[ServerSentEvent]:
    chat_after = await store.chat.last_id(world_id)
    shown_viewers = None
    with presence.watching(world_id):
        while True:
            for event in await store.events.get_all(world_id, after_id):
                after_id = event.id
                yield ServerSentEvent(data=event, id=str(event.id))
            for message in await store.chat.after(world_id, chat_after):
                chat_after = message.id
                yield ServerSentEvent(data=message, event="chat")
            viewers = presence.count(world_id)
            if viewers != shown_viewers:
                shown_viewers = viewers
                yield ServerSentEvent(data=viewers, event="viewers")
            await asyncio.sleep(settings.stream_poll_interval)
