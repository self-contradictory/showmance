# backend

## Run

```bash
uv sync
cp .env.example .env
uv run main.py
```

`.env` is loaded on startup. Every field in `config.py` can be set there or as an environment variable with the same name in capitals, for example `TICK_INTERVAL=1` for a fast demo.

| Variable | Default |
|---|---|
| `LLM_MODEL` | none: any Pydantic AI model string, plus that provider's API key (e.g. `OPENAI_API_KEY`, `GOOGLE_API_KEY`) in `.env` too |
| `CAST` | `agents`: who plays the contestants, see below |
| `DATABASE_URL` | `sqlite+aiosqlite:///villa.db` |
| `CORS_ORIGINS` | `["http://localhost:3000"]` (a JSON list) |
| `HOST` | `127.0.0.1` |
| `PORT` | `8000` |

## Who plays the contestants

The director (polls and twists) is the same either way. `CAST` picks how the contestants act and feel:

- `agents`: each contestant is its own model call. Every tick, everyone decides an action and everyone who saw something reacts, so about 12 calls a tick for six people.
- `writer`: one model call writes a scene of about `SCENE_LINES` lines for everyone, and each tick plays the next line. Feelings come with the lines, so reactions cost nothing. When `PREFETCH_LINES` lines are left, the next scene is written in the background, picking up after them, so scenes run on without a pause. A staged twist throws away the unplayed lines, cancels any scene being written, and the next tick writes a new scene. Use this on free tiers, with `TICK_INTERVAL=4` or so to match the captions.

Both keep the same state (places, moods, feelings, memories, events), so you can switch a running villa by restarting with the other `CAST`.

## Voices

Lines are voiced only when a player asks for them, once per line, and cached in `AUDIO_DIR`, so nobody watching costs nothing. `TTS` picks the provider behind the `Voice` interface in `voice/`. Each contestant keeps one voice: set `voice` per agent in the world spec, or one that no one else uses is picked and saved the first time they speak.

`TTS=kokoro` (the default) runs locally and is free. Download the model once:

```bash
mkdir -p models && cd models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin
```

## Start the villa

```bash
curl -X POST localhost:8000/worlds -H 'content-type: application/json' -d @villa.json
curl -X POST localhost:8000/worlds/1/start
curl -N localhost:8000/worlds/1/stream
```

## API

| Method | Path | |
|---|---|---|
| `GET` | `/worlds` | every world (name, thumbnail, setting, tick, day) with `running` and `viewers`, for the homepage |
| `POST` | `/worlds` | create a world from a spec like `villa.json`: `name`, `setting`, `thumbnail_url?`, locations, agents |
| `GET` | `/worlds/{id}` | world (with `day`), locations, agents, relationships, `running`, `viewers` |
| `GET` | `/worlds/{id}/events?after_id=` | event history |
| `GET` | `/worlds/{id}/stream?after_id=` | one SSE connection per viewer: world events (unnamed, with ids, resume from `Last-Event-ID`), `chat` events with new messages, `viewers` events when the count changes |
| `GET` | `/worlds/{id}/chat` | the last `CHAT_HISTORY` chat messages, oldest first |
| `POST` | `/worlds/{id}/chat` | send `{text}` to everyone watching 🔑 |
| `GET` | `/worlds/{id}/events/{event_id}/audio` | the voiced line of a `say` or `confess` event (`audio/wav`), made on the first request and cached for everyone |
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

`day` is `tick // TICKS_PER_DAY + 1`. `viewers` counts open stream connections on this server, so a second tab counts twice.
