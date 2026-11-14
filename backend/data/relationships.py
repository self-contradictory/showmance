from sqlalchemy import select

from config import settings
from data.db import Repository
from data.tables import AgentRow, RelationshipRow
from domain import Relationship, RelationshipChange


def _clamp(score: int) -> int:
    return max(settings.min_score, min(settings.max_score, score))


class RelationshipRepository(Repository):
    async def get_all(self, world_id: int) -> list[Relationship]:
        async with self._session() as s:
            rows = await s.scalars(
                select(RelationshipRow)
                .join(AgentRow, RelationshipRow.from_id == AgentRow.id)
                .where(AgentRow.world_id == world_id)
            )
            return [Relationship.model_validate(r) for r in rows]

    async def adjust(self, change: RelationshipChange) -> Relationship:
        async with self._session.begin() as s:
            row = await s.get(RelationshipRow, (change.from_id, change.to_id))
            if row is None:
                row = RelationshipRow(
                    from_id=change.from_id,
                    to_id=change.to_id,
                    affection=settings.neutral_score,
                    trust=settings.neutral_score,
                    note="",
                )
                s.add(row)
            row.affection = _clamp(row.affection + change.affection)
            row.trust = _clamp(row.trust + change.trust)
            if change.note is not None:
                row.note = change.note
        return Relationship.model_validate(row)
