from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from backend.data.tables import (
    AgentRow,
    Base,
    EventRow,
    LocationRow,
    RelationshipRow,
    WorldRow,
)
from backend.domain import Agent, Event, Location, Relationship, World

NEUTRAL = 50  # starting affection/trust between two agents; scores range 0..100


async def connect(url: str) -> AsyncEngine:
    """Open the database and create missing tables. `url` is any SQLAlchemy async URL."""
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return engine


def _clamp(score: int) -> int:
    return max(0, min(100, score))


class Store:
    """All reads and writes for worlds, locations, agents, relationships and events."""

    def __init__(self, engine: AsyncEngine) -> None:
        self._session = async_sessionmaker(engine, expire_on_commit=False)

    # worlds

    async def create_world(self, setting: str) -> World:
        row = WorldRow(setting=setting, tick=0)
        async with self._session.begin() as s:
            s.add(row)
        return World.model_validate(row)

    async def get_world(self, world_id: int) -> World:
        async with self._session() as s:
            return World.model_validate(await s.get_one(WorldRow, world_id))

    async def advance_tick(self, world_id: int) -> int:
        async with self._session.begin() as s:
            row = await s.get_one(WorldRow, world_id)
            row.tick += 1
        return row.tick

    # locations

    async def add_location(
        self, world_id: int, name: str, description: str = ""
    ) -> Location:
        row = LocationRow(world_id=world_id, name=name, description=description)
        async with self._session.begin() as s:
            s.add(row)
        return Location.model_validate(row)

    async def get_locations(self, world_id: int) -> list[Location]:
        async with self._session() as s:
            rows = await s.scalars(
                select(LocationRow).where(LocationRow.world_id == world_id)
            )
            return [Location.model_validate(r) for r in rows]

    # agents

    async def add_agent(
        self,
        world_id: int,
        name: str,
        persona: str,
        location_id: int,
        mood: str = "neutral",
    ) -> Agent:
        row = AgentRow(
            world_id=world_id,
            name=name,
            persona=persona,
            location_id=location_id,
            mood=mood,
        )
        async with self._session.begin() as s:
            s.add(row)
        return Agent.model_validate(row)

    async def get_agents(self, world_id: int) -> list[Agent]:
        async with self._session() as s:
            rows = await s.scalars(
                select(AgentRow).where(AgentRow.world_id == world_id)
            )
            return [Agent.model_validate(r) for r in rows]

    async def move_agent(self, agent_id: int, location_id: int) -> None:
        async with self._session.begin() as s:
            (await s.get_one(AgentRow, agent_id)).location_id = location_id

    async def set_mood(self, agent_id: int, mood: str) -> None:
        async with self._session.begin() as s:
            (await s.get_one(AgentRow, agent_id)).mood = mood

    # relationships

    async def get_relationships(self, world_id: int) -> list[Relationship]:
        async with self._session() as s:
            rows = await s.scalars(
                select(RelationshipRow)
                .join(AgentRow, RelationshipRow.from_id == AgentRow.id)
                .where(AgentRow.world_id == world_id)
            )
            return [Relationship.model_validate(r) for r in rows]

    async def adjust_relationship(
        self,
        from_id: int,
        to_id: int,
        affection: int = 0,
        trust: int = 0,
        note: str | None = None,
    ) -> Relationship:
        """Add deltas to how `from_id` feels about `to_id`. A pair with no row starts neutral."""
        async with self._session.begin() as s:
            row = await s.get(RelationshipRow, (from_id, to_id))
            if row is None:
                row = RelationshipRow(
                    from_id=from_id,
                    to_id=to_id,
                    affection=NEUTRAL,
                    trust=NEUTRAL,
                    note="",
                )
                s.add(row)
            row.affection = _clamp(row.affection + affection)
            row.trust = _clamp(row.trust + trust)
            if note is not None:
                row.note = note
        return Relationship.model_validate(row)

    # events

    async def add_event(
        self,
        world_id: int,
        tick: int,
        kind: str,
        *,
        actor_id: int | None = None,
        target_id: int | None = None,
        location_id: int | None = None,
        text: str | None = None,
        data: dict[str, Any] | None = None,
        witness_ids: list[int] | None = None,
    ) -> Event:
        row = EventRow(
            world_id=world_id,
            tick=tick,
            kind=kind,
            actor_id=actor_id,
            target_id=target_id,
            location_id=location_id,
            text=text,
            data=data or {},
            witness_ids=witness_ids or [],
        )
        async with self._session.begin() as s:
            s.add(row)
        return Event.model_validate(row)

    async def get_events(self, world_id: int, after_id: int = 0) -> list[Event]:
        """Events in the order they happened. Pass the last seen id to get only newer ones."""
        async with self._session() as s:
            rows = await s.scalars(
                select(EventRow)
                .where(EventRow.world_id == world_id, EventRow.id > after_id)
                .order_by(EventRow.id)
            )
            return [Event.model_validate(r) for r in rows]
