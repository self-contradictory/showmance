from typing import Literal

from domain.base import Model

TwistStatus = Literal["pending", "staged", "rejected"]
TwistSource = Literal["vote", "donation"]


class NewTwist(Model):
    world_id: int
    text: str
    source: TwistSource
    viewer_id: int | None = None
    poll_id: int | None = None
    price: int = 0


class Twist(NewTwist):
    id: int
    status: TwistStatus
    outcome: str | None
    tick: int | None
