import asyncio
import logging
from contextlib import suppress

from config import settings
from engine.engine import Engine

logger = logging.getLogger(__name__)


class Runner:
    def __init__(
        self, engine: Engine, world_id: int, interval: float = settings.tick_interval
    ) -> None:
        self._engine = engine
        self._world_id = world_id
        self._interval = interval
        self._stop = asyncio.Event()
        self._task: asyncio.Task[None] | None = None

    @property
    def running(self) -> bool:
        return self._task is not None and not self._task.done()

    def start(self) -> None:
        if self.running:
            return
        self._stop.clear()
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self._stop.set()
        if self._task is not None:
            await self._task

    async def _loop(self) -> None:
        while not self._stop.is_set():
            try:
                await self._engine.step(self._world_id)
            except Exception:
                logger.exception("tick failed for world %s", self._world_id)
            with suppress(TimeoutError):
                await asyncio.wait_for(self._stop.wait(), self._interval)
