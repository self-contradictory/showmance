import asyncio
from collections.abc import AsyncGenerator

from config import settings
from data import Store
from domain import Event


async def follow(store: Store, world_id: int, after_id: int) -> AsyncGenerator[Event]:
    while True:
        for event in await store.events.get_all(world_id, after_id):
            after_id = event.id
            yield event
        await asyncio.sleep(settings.stream_poll_interval)
