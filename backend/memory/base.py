from typing import Protocol

from config import RECALL_LIMIT
from domain import Memory, NewMemory


class MemoryStore(Protocol):
    async def remember(self, memory: NewMemory) -> None: ...

    async def recall(
        self, agent_id: int, situation: str, limit: int = RECALL_LIMIT
    ) -> list[Memory]: ...
