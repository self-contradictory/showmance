from typing import Any

from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class WorldRow(Base):
    __tablename__ = "worlds"

    id: Mapped[int] = mapped_column(primary_key=True)
    setting: Mapped[str]
    tick: Mapped[int]


class LocationRow(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    world_id: Mapped[int] = mapped_column(ForeignKey("worlds.id"), index=True)
    name: Mapped[str]
    description: Mapped[str]


class AgentRow(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(primary_key=True)
    world_id: Mapped[int] = mapped_column(ForeignKey("worlds.id"), index=True)
    name: Mapped[str]
    persona: Mapped[str]
    mood: Mapped[str]
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"))


class RelationshipRow(Base):
    __tablename__ = "relationships"

    from_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), primary_key=True)
    to_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), primary_key=True)
    affection: Mapped[int]
    trust: Mapped[int]
    note: Mapped[str]


class EventRow(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    world_id: Mapped[int] = mapped_column(ForeignKey("worlds.id"), index=True)
    tick: Mapped[int]
    kind: Mapped[str]
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("agents.id"))
    target_id: Mapped[int | None] = mapped_column(ForeignKey("agents.id"))
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"))
    text: Mapped[str | None]
    data: Mapped[dict[str, Any]] = mapped_column(JSON)
    witness_ids: Mapped[list[int]] = mapped_column(JSON)


class MemoryRow(Base):
    __tablename__ = "memories"

    id: Mapped[int] = mapped_column(primary_key=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), index=True)
    tick: Mapped[int]
    text: Mapped[str]
    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"))
