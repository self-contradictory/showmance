from typing import Literal

from domain.base import Model

PurchaseStatus = Literal["pending", "paid"]


class NewPurchase(Model):
    id: str
    viewer_id: int
    pack_id: str
    coins: int
    price_cents: int


class Purchase(NewPurchase):
    status: PurchaseStatus
