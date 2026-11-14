from typing import Literal

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

load_dotenv()

CastKind = Literal["agents", "writer"]
TtsKind = Literal["kokoro"]


class Settings(BaseSettings):
    llm_model: str | None = None
    cast: CastKind = "agents"
    database_url: str = "sqlite+aiosqlite:///villa.db"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    host: str = "127.0.0.1"
    port: int = 8000
    shutdown_timeout: int = 5

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
    vote_conflict_reason: str = (
        "Viewers are voting on this right now, so it's up to the vote."
    )

    viewer_name_max_length: int = 40
    starter_coins: int = 200
    twist_price: int = 50

    poll_ticks: int = 24

    chat_max_length: int = 300
    chat_history: int = 50

    ticks_per_day: int = 120

    tts: TtsKind = "kokoro"
    kokoro_model_path: str = "models/kokoro-v1.0.onnx"
    kokoro_voices_path: str = "models/voices-v1.0.bin"
    audio_dir: str = "audio"


settings = Settings()
