import asyncio
import io
import shutil
import wave

import numpy as np
from kokoro_onnx import Kokoro

from domain import Audio, Speech
from voice.base import Voice

ENGLISH_PREFIXES = ("a", "b")
FFMPEG = shutil.which("ffmpeg")
MP3_BITRATE = "48k"


class KokoroVoice(Voice):
    def __init__(
        self, model_path: str, voices_path: str, ffmpeg: str | None = FFMPEG
    ) -> None:
        self.name = "kokoro" if ffmpeg is None else "kokoro-mp3"
        self.media_type = "audio/wav" if ffmpeg is None else "audio/mpeg"
        self._ffmpeg = ffmpeg
        self._model_path = model_path
        self._voices_path = voices_path
        self._kokoro: Kokoro | None = None
        self._loading = asyncio.Lock()

    async def voices(self) -> list[str]:
        kokoro = await self._load()
        return [v for v in kokoro.get_voices() if v.startswith(ENGLISH_PREFIXES)]

    async def speak(self, speech: Speech) -> Audio:
        kokoro = await self._load()
        lang = "en-gb" if speech.voice.startswith("b") else "en-us"
        samples, rate = await asyncio.to_thread(
            kokoro.create, speech.text, voice=speech.voice, lang=lang
        )
        pcm = _pcm(samples)
        if self._ffmpeg is None:
            content = _wav(pcm, rate)
        else:
            content = await mp3(self._ffmpeg, pcm, rate)
        return Audio(content=content, media_type=self.media_type)

    async def _load(self) -> Kokoro:
        async with self._loading:
            if self._kokoro is None:
                self._kokoro = await asyncio.to_thread(
                    Kokoro, self._model_path, self._voices_path
                )
        return self._kokoro


def _pcm(samples: np.ndarray) -> bytes:
    return (np.clip(samples, -1.0, 1.0) * 32767).astype("<i2").tobytes()


def _wav(pcm: bytes, rate: int) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(pcm)
    return buffer.getvalue()


async def mp3(ffmpeg: str, pcm: bytes, rate: int) -> bytes:
    process = await asyncio.create_subprocess_exec(
        ffmpeg,
        "-loglevel",
        "error",
        "-f",
        "s16le",
        "-ar",
        str(rate),
        "-ac",
        "1",
        "-i",
        "pipe:0",
        "-b:a",
        MP3_BITRATE,
        "-f",
        "mp3",
        "pipe:1",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await process.communicate(pcm)
    if process.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {err.decode().strip()}")
    return out
