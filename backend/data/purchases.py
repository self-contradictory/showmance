from data.db import Repository
from data.errors import NotFound
from data.tables import PurchaseRow
from domain import NewPurchase, Purchase


class PurchaseRepository(Repository):
    async def add(self, purchase: NewPurchase) -> Purchase:
        row = PurchaseRow(**purchase.model_dump(), status="pending")
        async with self._session.begin() as s:
            s.add(row)
        return Purchase.model_validate(row)

    async def get(self, purchase_id: str) -> Purchase:
        async with self._session() as s:
            row = await s.get(PurchaseRow, purchase_id)
        if row is None:
            raise NotFound(f"purchase {purchase_id}")
        return Purchase.model_validate(row)
