import time
from collections import Counter
from collections.abc import Callable, Generator
from contextlib import contextmanager


class Presence:
    def __init__(self, clock: Callable[[], float] = time.monotonic) -> None:
        self._clock = clock
        self._watching: Counter[int] = Counter()
        self._left: dict[int, float] = {}
        self._homepage: float | None = None

    def count(self, world_id: int) -> int:
        return self._watching[world_id]

    @contextmanager
    def watching(self, world_id: int) -> Generator[None]:
        self._watching[world_id] += 1
        try:
            yield
        finally:
            self._watching[world_id] -= 1
            self._left[world_id] = self._clock()

    def visit_homepage(self) -> None:
        self._homepage = self._clock()

    def watched(self, world_id: int, grace: float) -> bool:
        if self._watching[world_id] > 0:
            return True
        now = self._clock()
        seen = (self._left.get(world_id), self._homepage)
        return any(at is not None and now - at < grace for at in seen)
