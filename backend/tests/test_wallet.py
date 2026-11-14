from sqlalchemy import func, select

from data.tables import CoinEntryRow
from domain import NewTwist


def donation(villa, viewer, price):
    return NewTwist(
        world_id=villa.world.id,
        text="tell Mia",
        source="donation",
        viewer_id=viewer.id,
        price=price,
    )


async def ledger_total(db, viewer):
    async with db.connect() as conn:
        return await conn.scalar(
            select(func.coalesce(func.sum(CoinEntryRow.amount), 0)).where(
                CoinEntryRow.viewer_id == viewer.id
            )
        )


async def test_buying_a_twist_spends_coins_and_refund_returns_them(store, db, villa):
    viewer, _ = await store.viewers.create("Ann")
    await store.wallets.grant(viewer.id, 100, "starter")

    twist = await store.wallets.buy_twist(donation(villa, viewer, 60))

    assert twist is not None
    assert (twist.status, twist.price, twist.viewer_id) == ("pending", 60, viewer.id)
    assert (await store.viewers.get(viewer.id)).coins == 40

    await store.wallets.refund_twist(twist)

    assert (await store.viewers.get(viewer.id)).coins == 100
    assert await ledger_total(db, viewer) == 100


async def test_cannot_spend_more_than_the_balance(store, db, villa):
    viewer, _ = await store.viewers.create("Ann")
    await store.wallets.grant(viewer.id, 50, "starter")

    assert await store.wallets.buy_twist(donation(villa, viewer, 60)) is None
    assert (await store.viewers.get(viewer.id)).coins == 50
    assert await store.twists.pending(villa.world.id, 10) == []
    assert await ledger_total(db, viewer) == 50
