from pydantic import Field

from domain.base import Model


class Reveal(Model):
    text: str
    to_ids: list[int]


class Announce(Model):
    text: str


class Relocate(Model):
    agent_id: int
    destination_id: int


class Arrive(Model):
    name: str
    persona: str
    location_id: int


class Nudge(Model):
    agent_id: int
    text: str


class Perform(Model):
    agent_id: int
    instruction: str


class TwistPlan(Model):
    summary: str
    arrivals: list[Arrive] = Field(default_factory=list)
    relocations: list[Relocate] = Field(default_factory=list)
    reveals: list[Reveal] = Field(default_factory=list)
    announcements: list[Announce] = Field(default_factory=list)
    nudges: list[Nudge] = Field(default_factory=list)
    performs: list[Perform] = Field(default_factory=list)


class Rejected(Model):
    reason: str
