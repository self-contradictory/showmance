from typing import Literal

from domain.base import Model

TwistStatus = Literal["pending", "staged", "rejected"]


class NewTwist(Model):
    world_id: int
    text: str


class Twist(NewTwist):
    id: int
    status: TwistStatus
    outcome: str | None
    tick: int | None
