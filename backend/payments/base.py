from typing import Protocol

from config import CoinPack
from domain import Viewer
from domain.base import Model


class Checkout(Model):
    id: str
    client_secret: str


class PaymentError(Exception):
    pass


class Payments(Protocol):
    async def checkout(self, pack: CoinPack, viewer: Viewer) -> Checkout: ...

    async def paid(self, checkout_id: str) -> bool: ...
