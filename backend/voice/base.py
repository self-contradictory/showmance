from typing import Protocol

from domain import Audio, Speech


class Voice(Protocol):
    name: str
    media_type: str

    async def voices(self) -> list[str]: ...

    async def speak(self, speech: Speech) -> Audio: ...
