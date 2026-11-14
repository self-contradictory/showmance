from typing import Any

from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class WorldRow(Base):
    __tablename__ = "worlds"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    setting: Mapped[str]
    thumbnail_url: Mapped[str | None]
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


class TwistRow(Base):
    __tablename__ = "twists"

    id: Mapped[int] = mapped_column(primary_key=True)
    world_id: Mapped[int] = mapped_column(ForeignKey("worlds.id"), index=True)
    text: Mapped[str]
    status: Mapped[str] = mapped_column(index=True)
    outcome: Mapped[str | None]
    tick: Mapped[int | None]
    source: Mapped[str]
    viewer_id: Mapped[int | None] = mapped_column(ForeignKey("viewers.id"))
    poll_id: Mapped[int | None] = mapped_column(ForeignKey("polls.id"))
    price: Mapped[int]


class ViewerRow(Base):
    __tablename__ = "viewers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    token_hash: Mapped[str] = mapped_column(unique=True)
    coins: Mapped[int]


class CoinEntryRow(Base):
    __tablename__ = "coin_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    viewer_id: Mapped[int] = mapped_column(ForeignKey("viewers.id"), index=True)
    amount: Mapped[int]
    reason: Mapped[str]
    twist_id: Mapped[int | None] = mapped_column(ForeignKey("twists.id"))


class PollRow(Base):
    __tablename__ = "polls"

    id: Mapped[int] = mapped_column(primary_key=True)
    world_id: Mapped[int] = mapped_column(ForeignKey("worlds.id"), index=True)
    question: Mapped[str]
    options: Mapped[list[dict[str, str]]] = mapped_column(JSON)
    opened_tick: Mapped[int]
    closes_tick: Mapped[int]
    status: Mapped[str] = mapped_column(index=True)
    winner: Mapped[int | None]


class VoteRow(Base):
    __tablename__ = "votes"

    poll_id: Mapped[int] = mapped_column(ForeignKey("polls.id"), primary_key=True)
    viewer_id: Mapped[int] = mapped_column(ForeignKey("viewers.id"), primary_key=True)
    option: Mapped[int]


class ChatRow(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    world_id: Mapped[int] = mapped_column(ForeignKey("worlds.id"), index=True)
    viewer_id: Mapped[int] = mapped_column(ForeignKey("viewers.id"))
    name: Mapped[str]
    text: Mapped[str]
