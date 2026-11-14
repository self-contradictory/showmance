from sqlalchemy import select

from data.db import Repository
from data.tables import EventRow
from domain import Event, NewEvent


class EventRepository(Repository):
    async def add(self, event: NewEvent) -> Event:
        row = EventRow(**event.model_dump())
        async with self._session.begin() as s:
            s.add(row)
        return Event.model_validate(row)

    async def get_all(self, world_id: int, after_id: int = 0) -> list[Event]:
        async with self._session() as s:
            rows = await s.scalars(
                select(EventRow)
                .where(EventRow.world_id == world_id, EventRow.id > after_id)
                .order_by(EventRow.id)
            )
            return [Event.model_validate(r) for r in rows]
