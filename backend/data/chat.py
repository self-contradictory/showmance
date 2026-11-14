from sqlalchemy import func, select

from data.db import Repository
from data.tables import ChatRow
from domain import ChatMessage, NewChatMessage


class ChatRepository(Repository):
    async def add(self, message: NewChatMessage) -> ChatMessage:
        row = ChatRow(**message.model_dump())
        async with self._session.begin() as s:
            s.add(row)
        return ChatMessage.model_validate(row)

    async def recent(self, world_id: int, limit: int) -> list[ChatMessage]:
        async with self._session() as s:
            rows = await s.scalars(
                select(ChatRow)
                .where(ChatRow.world_id == world_id)
                .order_by(ChatRow.id.desc())
                .limit(limit)
            )
            return [ChatMessage.model_validate(r) for r in reversed(rows.all())]

    async def after(self, world_id: int, after_id: int) -> list[ChatMessage]:
        async with self._session() as s:
            rows = await s.scalars(
                select(ChatRow)
                .where(ChatRow.world_id == world_id, ChatRow.id > after_id)
                .order_by(ChatRow.id)
            )
            return [ChatMessage.model_validate(r) for r in rows]

    async def last_id(self, world_id: int) -> int:
        async with self._session() as s:
            last = await s.scalar(
                select(func.max(ChatRow.id)).where(ChatRow.world_id == world_id)
            )
        return last or 0
