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
| `PACING` | `parallel`: how much happens at once with `CAST=writer`, see below |
| `DATABASE_URL` | `sqlite+aiosqlite:///villa.db` |
| `CORS_ORIGINS` | `["http://localhost:3000"]` (a JSON list) |
| `HOST` | `127.0.0.1` |
| `PORT` | `8000` |
| `STRIPE_SECRET_KEY` | none: buying coins is off without it, see Coins |

## Who plays the contestants

The director (polls and twists) is the same either way. `CAST` picks how the contestants act and feel:

- `agents`: each contestant is its own model call. Every tick, everyone decides an action and everyone who saw something reacts, so about 12 calls a tick for six people.
- `writer`: one model call writes a scene of about `SCENE_BEATS` beats for everyone, and each tick plays the next beat. `PACING` sets how much happens in a beat. Feelings come with the lines, so reactions cost nothing. When `PREFETCH_BEATS` beats are left, the next scene is written in the background, picking up after them, so scenes run on without a pause. A staged twist throws away the unplayed beats, cancels any scene being written, and the next tick writes a new scene. Use this on free tiers, with `TICK_INTERVAL=4` or so to match the captions.

Both keep the same state (places, moods, feelings, memories, events), so you can switch a running villa by restarting with the other `CAST`.

## Pacing

With `CAST=writer`, `PACING` picks how much happens at once. Each option is a `Pacing` in `engine/casts/pacing.py` with two parts: the rules the writer gets for beats, and which lines can play in the same tick. Writing, playing, prefetching and twists are shared.

- `parallel`: several people act in one beat. One person talks while others move, hug or kiss, and people who go somewhere together walk at the same time. Lines in a beat play in the order written, so someone can walk in and be greeted in one beat. A second line for the same person, or a second speaker, waits for the next beat.
- `sequential`: one line per beat, so one person acts at a time.

The frontend plays everything from one tick together, so it needs no setting.

## Voices

Lines are voiced only when a player asks for them, once per line, and cached in `AUDIO_DIR`, so nobody watching costs nothing. `TTS` picks the provider behind the `Voice` interface in `voice/`. Each contestant keeps one voice: set `voice` per agent in the world spec, or one that no one else uses is picked and saved the first time they speak.

`TTS=kokoro` (the default) runs locally and is free. Download the model once:

```bash
mkdir -p models && cd models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin
```

## Coins

Every viewer starts with `STARTER_COINS` and a twist costs `TWIST_PRICE`. Viewers buy more in packs (`COIN_PACKS`, priced in cents of `CURRENCY`) through Stripe's embedded checkout, so they pay without leaving the show.

1. Make a free Stripe account and copy the test secret key (Developers, then API keys) into `.env` as `STRIPE_SECRET_KEY=sk_test_...`. The frontend needs the matching publishable key.
2. `POST /purchases` starts a checkout for a pack and returns its client secret for the checkout form.
3. When the form finishes, `POST /purchases/{id}/confirm` asks Stripe whether it was paid and adds the coins. Each purchase adds coins once, however many times it's confirmed.

Pay with the test card `4242 4242 4242 4242`, any future date and any CVC. Payments go through a `Payments` interface in `payments/`, with Stripe behind it. Before taking real money, add a Stripe webhook that settles purchases too, so coins arrive even if someone closes the tab while paying.

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
| `POST` | `/worlds` | create a world from a spec like `villa.json`: `name`, `setting`, `thumbnail_url?`, locations, agents (each with `gender`: `female` or `male`) |
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
| `GET` | `/packs` | the coin packs and their currency |
| `POST` | `/purchases` | start buying `{pack_id}`: returns the checkout `id` and `client_secret`; `503` without `STRIPE_SECRET_KEY` 🔑 |
| `POST` | `/purchases/{id}/confirm` | add the pack's coins once Stripe says it's paid, `409` before that; returns your viewer 🔑 |
| `POST` | `/worlds/{id}/twists` | pay `TWIST_PRICE` coins for a free-text twist `{text}`, staged on the next tick; `402` without enough coins 🔑 |
| `GET` | `/worlds/{id}/twists/{twist_id}` | twist status: pending, staged with a summary, or rejected with a reason (refunded) |

🔑 needs `Authorization: Bearer <token>` from `POST /viewers`.

The director opens a new poll whenever none is running (yes/no, two or three options, picked at random) and it closes after `POLL_TICKS` ticks. The winning option is staged in that same tick. Paid twists that match or counter an open poll option are rejected and refunded.

## Test

```bash
uv run pytest
```

`day` is `tick // TICKS_PER_DAY + 1`. `viewers` counts open stream connections on this server, so a second tab counts twice.
