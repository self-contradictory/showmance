from sqlalchemy import select

from data.db import Repository
from data.tables import AgentRow, AgentVoiceRow


class VoiceRepository(Repository):
    async def get(self, agent_id: int) -> str | None:
        async with self._session() as s:
            row = await s.get(AgentVoiceRow, agent_id)
        return None if row is None else row.voice

    async def assign(self, agent_id: int, voice: str) -> None:
        async with self._session.begin() as s:
            row = await s.get(AgentVoiceRow, agent_id)
            if row is None:
                s.add(AgentVoiceRow(agent_id=agent_id, voice=voice))
            else:
                row.voice = voice

    async def taken(self, world_id: int) -> set[str]:
        async with self._session() as s:
            voices = await s.scalars(
                select(AgentVoiceRow.voice)
                .join(AgentRow, AgentVoiceRow.agent_id == AgentRow.id)
                .where(AgentRow.world_id == world_id)
            )
            return set(voices)
