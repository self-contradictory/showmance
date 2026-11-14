from sqlalchemy import select

from data.db import Repository
from data.errors import NotFound
from data.tables import TwistRow
from domain import NewTwist, Twist, TwistStatus


class TwistRepository(Repository):
    async def add(self, twist: NewTwist) -> Twist:
        row = TwistRow(**twist.model_dump(), status="pending", outcome=None, tick=None)
        async with self._session.begin() as s:
            s.add(row)
        return Twist.model_validate(row)

    async def get(self, twist_id: int) -> Twist:
        async with self._session() as s:
            row = await s.get(TwistRow, twist_id)
        if row is None:
            raise NotFound(f"twist {twist_id}")
        return Twist.model_validate(row)

    async def pending(self, world_id: int, limit: int) -> list[Twist]:
        async with self._session() as s:
            rows = await s.scalars(
                select(TwistRow)
                .where(TwistRow.world_id == world_id, TwistRow.status == "pending")
                .order_by(TwistRow.id)
                .limit(limit)
            )
            return [Twist.model_validate(r) for r in rows]

    async def stage(self, twist_id: int, summary: str, tick: int) -> None:
        await self._resolve(twist_id, "staged", summary, tick)

    async def reject(self, twist_id: int, reason: str, tick: int) -> None:
        await self._resolve(twist_id, "rejected", reason, tick)

    async def _resolve(
        self, twist_id: int, status: TwistStatus, outcome: str, tick: int
    ) -> None:
        async with self._session.begin() as s:
            row = await s.get_one(TwistRow, twist_id)
            row.status = status
            row.outcome = outcome
            row.tick = tick
