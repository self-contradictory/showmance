import asyncio

import numpy as np
import pytest

from domain import NewEvent
from voice.kokoro import FFMPEG, mp3


async def say(store, villa, agent, text, **data):
    return await store.events.add(
        NewEvent(
            world_id=villa.world.id,
            tick=1,
            kind="say",
            actor_id=agent.id,
            text=text,
            data=data,
        )
    )


async def test_line_is_voiced_once_in_the_agents_voice(
    store, villa, narrator, fake_voice
):
    await store.voices.assign(villa.mia.id, "v2")
    event = await say(store, villa, villa.mia, "Again?", emotion="happy")

    first, second = await asyncio.gather(narrator.audio(event), narrator.audio(event))
    third = await narrator.audio(event)

    assert first == second == third
    assert first is not None
    assert (first.content, first.media_type) == (b"v2|Again?|happy", "audio/wav")
    assert len(fake_voice.spoken) == 1


async def test_agent_without_a_voice_gets_a_free_one_that_sticks(
    store, villa, narrator
):
    await store.voices.assign(villa.mia.id, "v1")

    hi = await narrator.audio(await say(store, villa, villa.jake, "Hi"))
    bye = await narrator.audio(await say(store, villa, villa.jake, "Bye"))

    voice = await store.voices.get(villa.jake.id)
    assert voice in {"v2", "v3"}
    assert hi is not None and hi.content.startswith(f"{voice}|".encode())
    assert bye is not None and bye.content.startswith(f"{voice}|".encode())


async def test_only_spoken_lines_have_audio(store, villa, narrator):
    hug = await store.events.add(
        NewEvent(
            world_id=villa.world.id,
            tick=1,
            kind="hug",
            actor_id=villa.jake.id,
            target_id=villa.mia.id,
        )
    )

    assert await narrator.audio(hug) is None


async def test_audio_endpoint_serves_spoken_lines(store, villa, sim, client):
    line = await say(store, villa, villa.mia, "Hello")
    hug = await store.events.add(
        NewEvent(world_id=villa.world.id, tick=1, kind="hug", actor_id=villa.mia.id)
    )
    events = f"/worlds/{villa.world.id}/events"
    async with client(sim().engine) as http:
        audio = await http.get(f"{events}/{line.id}/audio")
        silent = await http.get(f"{events}/{hug.id}/audio")
        missing = await http.get(f"{events}/999/audio")

    assert audio.status_code == 200
    assert audio.headers["content-type"] == "audio/wav"
    assert "immutable" in audio.headers["cache-control"]
    assert audio.content.endswith(b"|Hello|None")
    assert (silent.status_code, missing.status_code) == (404, 404)


async def test_world_spec_sets_voices(store, sim, client):
    spec = {
        "name": "Villa",
        "setting": "A villa",
        "locations": [{"name": "pool"}],
        "agents": [
            {
                "name": "Mia",
                "persona": "",
                "gender": "female",
                "location": "pool",
                "voice": "v3",
            }
        ],
    }
    async with client(sim().engine) as http:
        world = (await http.post("/worlds", json=spec)).json()

    [mia] = await store.agents.get_all(world["id"])
    assert await store.voices.get(mia.id) == "v3"


async def test_same_line_in_the_same_voice_is_voiced_once(
    store, villa, narrator, fake_voice
):
    await store.voices.assign(villa.mia.id, "v1")

    await narrator.audio(await say(store, villa, villa.mia, "Hi"))
    await narrator.audio(await say(store, villa, villa.mia, "Hi"))
    await narrator.audio(await say(store, villa, villa.mia, "Bye"))

    assert [speech.text for speech in fake_voice.spoken] == ["Hi", "Bye"]


@pytest.mark.skipif(FFMPEG is None, reason="needs ffmpeg")
async def test_lines_are_sent_as_small_mp3s():
    rate = 24000
    tone = np.sin(2 * np.pi * 440 * np.arange(rate) / rate) * 0.3
    pcm = (tone * 32767).astype("<i2").tobytes()

    encoded = await mp3(FFMPEG, pcm, rate)

    assert encoded[:3] == b"ID3" or encoded[0] == 0xFF
    assert len(encoded) < len(pcm) / 5
