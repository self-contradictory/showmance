from typing import Literal

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

load_dotenv()

CastKind = Literal["agents", "writer"]


class Settings(BaseSettings):
    llm_model: str | None = None
    cast: CastKind = "agents"
    database_url: str = "sqlite+aiosqlite:///villa.db"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    default_mood: str = "neutral"

    min_score: int = 0
    max_score: int = 100
    neutral_score: int = 50
    max_feeling_change: int = 10

    recall_limit: int = 20
    scene_lines: int = 12
    prefetch_lines: int = 3

    tick_interval: float = 5.0
    stream_poll_interval: float = 1.0

    twist_max_length: int = 500
    twists_per_tick: int = 3
    director_event_limit: int = 30
    twist_failed_reason: str = "The producers couldn't stage this twist."

    viewer_name_max_length: int = 40
    starter_coins: int = 200
    twist_price: int = 50

    poll_ticks: int = 24


settings = Settings()
