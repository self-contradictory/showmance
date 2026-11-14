from collections import Counter
from collections.abc import Generator
from contextlib import contextmanager


class Presence:
    def __init__(self) -> None:
        self._watching: Counter[int] = Counter()

    def count(self, world_id: int) -> int:
        return self._watching[world_id]

    @contextmanager
    def watching(self, world_id: int) -> Generator[None]:
        self._watching[world_id] += 1
        try:
            yield
        finally:
            self._watching[world_id] -= 1
