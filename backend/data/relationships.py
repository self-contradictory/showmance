from sqlalchemy import select

from config import MAX_SCORE, MIN_SCORE, NEUTRAL_SCORE
from data.db import Repository
from data.tables import AgentRow, RelationshipRow
from domain import Relationship, RelationshipChange


def _clamp(score: int) -> int:
    return max(MIN_SCORE, min(MAX_SCORE, score))


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
                    affection=NEUTRAL_SCORE,
                    trust=NEUTRAL_SCORE,
                    note="",
                )
                s.add(row)
            row.affection = _clamp(row.affection + change.affection)
            row.trust = _clamp(row.trust + change.trust)
            if change.note is not None:
                row.note = change.note
        return Relationship.model_validate(row)
