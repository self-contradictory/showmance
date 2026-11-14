from sqlalchemy import update

from data.db import Repository
from data.tables import CoinEntryRow, ViewerRow
from data.twists import pending_row
from domain import CoinReason, NewTwist, Twist


class WalletRepository(Repository):
    async def grant(self, viewer_id: int, amount: int, reason: CoinReason) -> None:
        async with self._session.begin() as s:
            await s.execute(
                update(ViewerRow)
                .where(ViewerRow.id == viewer_id)
                .values(coins=ViewerRow.coins + amount)
            )
            s.add(CoinEntryRow(viewer_id=viewer_id, amount=amount, reason=reason))

    async def buy_twist(self, twist: NewTwist) -> Twist | None:
        viewer_id = twist.viewer_id
        if viewer_id is None:
            return None
        async with self._session.begin() as s:
            balance = await s.scalar(
                update(ViewerRow)
                .where(ViewerRow.id == viewer_id, ViewerRow.coins >= twist.price)
                .values(coins=ViewerRow.coins - twist.price)
                .returning(ViewerRow.coins)
            )
            if balance is None:
                return None
            row = pending_row(twist)
            s.add(row)
            await s.flush()
            s.add(
                CoinEntryRow(
                    viewer_id=viewer_id,
                    amount=-twist.price,
                    reason="twist",
                    twist_id=row.id,
                )
            )
        return Twist.model_validate(row)

    async def refund_twist(self, twist: Twist) -> None:
        if twist.viewer_id is None or twist.price == 0:
            return
        async with self._session.begin() as s:
            await s.execute(
                update(ViewerRow)
                .where(ViewerRow.id == twist.viewer_id)
                .values(coins=ViewerRow.coins + twist.price)
            )
            s.add(
                CoinEntryRow(
                    viewer_id=twist.viewer_id,
                    amount=twist.price,
                    reason="refund",
                    twist_id=twist.id,
                )
            )
