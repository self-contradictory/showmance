# backend

## Run

```bash
uv sync
LLM_MODEL=<provider:model> uv run uvicorn api.app:app --reload
```

Settings come from environment variables (or `uv run --env-file .env ...`):

| Variable | Default |
|---|---|
| `LLM_MODEL` | none, any Pydantic AI model string, plus that provider's API key |
| `DATABASE_URL` | `sqlite+aiosqlite:///villa.db` |
| `CORS_ORIGINS` | `http://localhost:3000` (comma separated) |

## Start the villa

```bash
curl -X POST localhost:8000/worlds -H 'content-type: application/json' -d @villa.json
curl -X POST localhost:8000/worlds/1/start
curl -N localhost:8000/worlds/1/stream
```

## API

| Method | Path | |
|---|---|---|
| `POST` | `/worlds` | create a world from a spec like `villa.json` |
| `GET` | `/worlds/{id}` | world, locations, agents, relationships, running |
| `GET` | `/worlds/{id}/events?after_id=` | event history |
| `GET` | `/worlds/{id}/stream?after_id=` | live events over SSE, resumes from `Last-Event-ID` |
| `POST` | `/worlds/{id}/step` | run one tick |
| `POST` | `/worlds/{id}/start` | tick every `TICK_INTERVAL` seconds |
| `POST` | `/worlds/{id}/stop` | stop after the current tick |
| `POST` | `/worlds/{id}/twists` | send a twist in free text: `{text}`, staged on the next tick |
| `GET` | `/worlds/{id}/twists/{twist_id}` | twist status: pending, staged with a summary, or rejected with a reason |

## Test

```bash
uv run pytest
```
