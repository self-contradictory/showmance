import asyncio
from collections import defaultdict

from data import Store
from domain import SPOKEN_KINDS, Audio, Event, Speech
from voice.base import Voice
from voice.cache import AudioCache


class Narrator:
    def __init__(self, store: Store, voice: Voice, cache: AudioCache) -> None:
        self._store = store
        self._voice = voice
        self._cache = cache
        self._locks: defaultdict[int, asyncio.Lock] = defaultdict(asyncio.Lock)

    async def audio(self, event: Event) -> Audio | None:
        if event.kind not in SPOKEN_KINDS or not event.text or event.actor_id is None:
            return None
        key = f"{self._voice.name}/{event.id}"
        async with self._locks[event.id]:
            content = self._cache.get(key)
            if content is None:
                speech = Speech(
                    text=event.text,
                    voice=await self._voice_for(event.actor_id, event.world_id),
                    emotion=event.data.get("emotion"),
                )
                content = (await self._voice.speak(speech)).content
                self._cache.put(key, content)
        self._locks.pop(event.id, None)
        return Audio(content=content, media_type=self._voice.media_type)

    async def _voice_for(self, agent_id: int, world_id: int) -> str:
        available = await self._voice.voices()
        chosen = await self._store.voices.get(agent_id)
        if chosen in available:
            return chosen
        taken = await self._store.voices.taken(world_id)
        free = [voice for voice in available if voice not in taken] or available
        voice = free[agent_id % len(free)]
        await self._store.voices.assign(agent_id, voice)
        return voice
