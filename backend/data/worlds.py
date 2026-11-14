from data.db import Repository
from data.tables import WorldRow
from domain import World


class WorldRepository(Repository):
    async def create(self, setting: str) -> World:
        row = WorldRow(setting=setting, tick=0)
        async with self._session.begin() as s:
            s.add(row)
        return World.model_validate(row)

    async def get(self, world_id: int) -> World:
        async with self._session() as s:
            return World.model_validate(await s.get_one(WorldRow, world_id))

    async def advance_tick(self, world_id: int) -> int:
        async with self._session.begin() as s:
            row = await s.get_one(WorldRow, world_id)
            row.tick += 1
        return row.tick
