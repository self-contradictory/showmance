from domain.base import Model

SPOKEN_KINDS = ("say", "confess")


class Speech(Model):
    text: str
    voice: str
    emotion: str | None = None


class Audio(Model):
    content: bytes
    media_type: str
