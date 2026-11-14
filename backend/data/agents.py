from sqlalchemy import select

from data.db import Repository
from data.tables import AgentRow
from domain import Agent, NewAgent


class AgentRepository(Repository):
    async def add(self, agent: NewAgent) -> Agent:
        row = AgentRow(**agent.model_dump())
        async with self._session.begin() as s:
            s.add(row)
        return Agent.model_validate(row)

    async def get_all(self, world_id: int) -> list[Agent]:
        async with self._session() as s:
            rows = await s.scalars(
                select(AgentRow).where(AgentRow.world_id == world_id)
            )
            return [Agent.model_validate(r) for r in rows]

    async def move(self, agent_id: int, location_id: int) -> None:
        async with self._session.begin() as s:
            (await s.get_one(AgentRow, agent_id)).location_id = location_id

    async def set_mood(self, agent_id: int, mood: str) -> None:
        async with self._session.begin() as s:
            (await s.get_one(AgentRow, agent_id)).mood = mood
