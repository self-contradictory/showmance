from typing import Literal

from domain.base import Model

CoinReason = Literal["starter", "twist", "refund", "purchase"]


class Viewer(Model):
    id: int
    name: str
    coins: int
