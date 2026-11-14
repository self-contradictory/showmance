import asyncio
import io
import wave

import numpy as np
from kokoro_onnx import Kokoro

from domain import Audio, Speech
from voice.base import Voice

ENGLISH_PREFIXES = ("a", "b")


class KokoroVoice(Voice):
    name = "kokoro"
    media_type = "audio/wav"

    def __init__(self, model_path: str, voices_path: str) -> None:
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
        return Audio(content=_wav(samples, rate), media_type=self.media_type)

    async def _load(self) -> Kokoro:
        async with self._loading:
            if self._kokoro is None:
                self._kokoro = await asyncio.to_thread(
                    Kokoro, self._model_path, self._voices_path
                )
        return self._kokoro


def _wav(samples: np.ndarray, rate: int) -> bytes:
    pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype("<i2")
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(pcm.tobytes())
    return buffer.getvalue()
