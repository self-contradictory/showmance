from sqlalchemy import select

from config import RECALL_LIMIT
from data.db import Repository
from data.tables import MemoryRow
from domain import Memory, NewMemory
from memory.base import MemoryStore


class SqlMemoryStore(Repository, MemoryStore):
    async def remember(self, memory: NewMemory) -> None:
        async with self._session.begin() as s:
            s.add(MemoryRow(**memory.model_dump()))

    async def recall(
        self, agent_id: int, situation: str, limit: int = RECALL_LIMIT
    ) -> list[Memory]:
        async with self._session() as s:
            rows = await s.scalars(
                select(MemoryRow)
                .where(MemoryRow.agent_id == agent_id)
                .order_by(MemoryRow.id.desc())
                .limit(limit)
            )
            return [Memory.model_validate(r) for r in reversed(rows.all())]
