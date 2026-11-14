from sqlalchemy import select

from data.db import Repository
from data.errors import NotFound
from data.tables import WorldRow
from domain import NewWorld, World


class WorldRepository(Repository):
    async def create(self, world: NewWorld) -> World:
        row = WorldRow(**world.model_dump(), tick=0)
        async with self._session.begin() as s:
            s.add(row)
        return World.model_validate(row)

    async def get(self, world_id: int) -> World:
        async with self._session() as s:
            row = await s.get(WorldRow, world_id)
        if row is None:
            raise NotFound(f"world {world_id}")
        return World.model_validate(row)

    async def get_all(self) -> list[World]:
        async with self._session() as s:
            rows = await s.scalars(select(WorldRow).order_by(WorldRow.id))
            return [World.model_validate(r) for r in rows]

    async def advance_tick(self, world_id: int) -> int:
        async with self._session.begin() as s:
            row = await s.get_one(WorldRow, world_id)
            row.tick += 1
        return row.tick
