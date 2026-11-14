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
| `POST` | `/viewers` | join with `{name}`: returns the viewer (with `STARTER_COINS`) and a token |
| `GET` | `/viewers/me` | your viewer and coin balance 🔑 |
| `GET` | `/worlds/{id}/poll` | the open poll and its vote counts, or `null` |
| `POST` | `/worlds/{id}/poll/vote` | vote with `{option}`, voting again changes your vote 🔑 |
| `POST` | `/worlds/{id}/twists` | pay `TWIST_PRICE` coins for a free-text twist `{text}`, staged on the next tick; `402` without enough coins 🔑 |
| `GET` | `/worlds/{id}/twists/{twist_id}` | twist status: pending, staged with a summary, or rejected with a reason (refunded) |

🔑 needs `Authorization: Bearer <token>` from `POST /viewers`.

The director opens a new poll whenever none is running (yes/no, two or three options, picked at random) and it closes after `POLL_TICKS` ticks. The winning option is staged in that same tick. Paid twists that match or counter an open poll option are rejected and refunded.

## Test

```bash
uv run pytest
```
