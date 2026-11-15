import asyncio
import logging

from api.presence import Presence
from api.runners import Runners
from config import settings
from data import Store

logger = logging.getLogger(__name__)


class Autopilot:
    def __init__(self, store: Store, runners: Runners, presence: Presence) -> None:
        self._store = store
        self._runners = runners
        self._presence = presence

    async def sync(self) -> None:
        for world in await self._store.worlds.get_all():
            watched = self._presence.watched(world.id, settings.idle_grace)
            running = self._runners.running(world.id)
            if watched and not running:
                self._runners.start(world.id)
            elif running and not watched:
                await self._runners.stop(world.id)

    async def run(self) -> None:
        while True:
            try:
                await self.sync()
            except Exception:
                logger.exception("autopilot failed")
            await asyncio.sleep(settings.presence_check_interval)
