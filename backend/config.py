import os

LLM_MODEL = os.getenv("LLM_MODEL")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///villa.db")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

DEFAULT_MOOD = "neutral"

MIN_SCORE = 0
MAX_SCORE = 100
NEUTRAL_SCORE = 50
MAX_FEELING_CHANGE = 10

RECALL_LIMIT = 20

TICK_INTERVAL = 5.0
STREAM_POLL_INTERVAL = 1.0
