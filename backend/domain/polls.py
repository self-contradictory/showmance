from typing import Literal

from domain.base import Model

PollFormat = Literal["yes_no", "two_options", "three_options"]
PollStatus = Literal["open", "closed"]

OPTION_COUNTS: dict[PollFormat, int] = {
    "yes_no": 2,
    "two_options": 2,
    "three_options": 3,
}
YES_NO_LABELS = ("Yes", "No")


class PollOption(Model):
    label: str
    twist: str


class Proposal(Model):
    question: str
    options: list[PollOption]


class NewPoll(Model):
    world_id: int
    question: str
    options: list[PollOption]
    opened_tick: int
    closes_tick: int


class Poll(NewPoll):
    id: int
    status: PollStatus
    winner: int | None
