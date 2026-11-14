from sqlalchemy import select

from data.db import Repository
from data.tables import LocationRow
from domain import Location, NewLocation


class LocationRepository(Repository):
    async def add(self, location: NewLocation) -> Location:
        row = LocationRow(**location.model_dump())
        async with self._session.begin() as s:
            s.add(row)
        return Location.model_validate(row)

    async def get_all(self, world_id: int) -> list[Location]:
        async with self._session() as s:
            rows = await s.scalars(
                select(LocationRow).where(LocationRow.world_id == world_id)
            )
            return [Location.model_validate(r) for r in rows]
