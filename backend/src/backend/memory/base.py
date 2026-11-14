from typing import Protocol

from backend.domain import Memory


class MemoryStore(Protocol):
    """What each agent remembers. The engine and AI layer only use these two calls,
    so the storage behind them (SQL, embeddings, an external memory service) can be swapped."""

    async def remember(
        self, agent_id: int, text: str, tick: int, event_id: int | None = None
    ) -> None: ...

    async def recall(
        self, agent_id: int, situation: str, limit: int = 20
    ) -> list[Memory]:
        """Memories relevant to `situation`, oldest first."""
        ...
