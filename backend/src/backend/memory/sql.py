from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker

from backend.data.tables import MemoryRow
from backend.domain import Memory
from backend.memory.base import MemoryStore


class SqlMemoryStore(MemoryStore):
    """v1: memories live in the main database and recall returns the most recent ones."""

    def __init__(self, engine: AsyncEngine) -> None:
        self._session = async_sessionmaker(engine, expire_on_commit=False)

    async def remember(
        self, agent_id: int, text: str, tick: int, event_id: int | None = None
    ) -> None:
        async with self._session.begin() as s:
            s.add(MemoryRow(agent_id=agent_id, text=text, tick=tick, event_id=event_id))

    async def recall(
        self, agent_id: int, situation: str, limit: int = 20
    ) -> list[Memory]:
        # `situation` is unused here; a search-based store ranks memories by it.
        async with self._session() as s:
            rows = await s.scalars(
                select(MemoryRow)
                .where(MemoryRow.agent_id == agent_id)
                .order_by(MemoryRow.id.desc())
                .limit(limit)
            )
            return [Memory.model_validate(r) for r in reversed(rows.all())]
