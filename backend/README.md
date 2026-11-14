# backend

## Run

```bash
uv sync
cp .env.example .env
uv run uvicorn api.app:app --reload
```

`.env` is loaded on startup. Every field in `config.py` can be set there or as an environment variable with the same name in capitals, for example `TICK_INTERVAL=1` for a fast demo.

| Variable | Default |
|---|---|
| `LLM_MODEL` | none: any Pydantic AI model string, plus that provider's API key (e.g. `OPENAI_API_KEY`, `GOOGLE_API_KEY`) in `.env` too |
| `CAST` | `agents`: who plays the contestants, see below |
| `DATABASE_URL` | `sqlite+aiosqlite:///villa.db` |
| `CORS_ORIGINS` | `["http://localhost:3000"]` (a JSON list) |

## Who plays the contestants

The director (polls and twists) is the same either way. `CAST` picks how the contestants act and feel:

- `agents`: each contestant is its own model call. Every tick, everyone decides an action and everyone who saw something reacts, so about 12 calls a tick for six people.
- `writer`: one model call writes a scene of about `SCENE_LINES` lines for everyone, and each tick plays the next line. Feelings come with the lines, so reactions cost nothing. A staged twist throws away the unplayed lines and the next tick writes a new scene. Use this on free tiers, with `TICK_INTERVAL=4` or so to match the captions.

Both keep the same state (places, moods, feelings, memories, events), so you can switch a running villa by restarting with the other `CAST`.

## Start the villa

```bash
curl -X POST localhost:8000/worlds -H 'content-type: application/json' -d @villa.json
curl -X POST localhost:8000/worlds/1/start
curl -N localhost:8000/worlds/1/stream
```

## API

| Method | Path | |
|---|---|---|
| `GET` | `/worlds` | every world (name, thumbnail, setting, tick) with `running`, for the homepage |
| `POST` | `/worlds` | create a world from a spec like `villa.json`: `name`, `setting`, `thumbnail_url?`, locations, agents |
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
