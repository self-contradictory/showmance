from sqlalchemy import update

from data.db import Repository
from data.tables import CoinEntryRow, ViewerRow
from domain import CoinReason


class WalletRepository(Repository):
    async def grant(self, viewer_id: int, amount: int, reason: CoinReason) -> None:
        async with self._session.begin() as s:
            await s.execute(
                update(ViewerRow)
                .where(ViewerRow.id == viewer_id)
                .values(coins=ViewerRow.coins + amount)
            )
            s.add(CoinEntryRow(viewer_id=viewer_id, amount=amount, reason=reason))
