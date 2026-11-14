from fastapi import APIRouter, HTTPException

from api.deps import PaymentsDep, ServicesDep, ViewerDep
from api.schemas import CoinShop, PurchaseRequest
from config import CoinPack, settings
from data import NotFound
from domain import NewPurchase, Purchase, Viewer
from payments import Checkout, PaymentError

router = APIRouter()


@router.get("/packs")
async def packs() -> CoinShop:
    return CoinShop(currency=settings.currency, packs=settings.coin_packs)


@router.post("/purchases", status_code=201)
async def start_purchase(
    body: PurchaseRequest,
    viewer: ViewerDep,
    services: ServicesDep,
    payments: PaymentsDep,
) -> Checkout:
    pack = _pack(body.pack_id)
    try:
        checkout = await payments.checkout(pack, viewer)
    except PaymentError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    await services.store.purchases.add(
        NewPurchase(
            id=checkout.id,
            viewer_id=viewer.id,
            pack_id=pack.id,
            coins=pack.coins,
            price_cents=pack.price_cents,
        )
    )
    return checkout


@router.post("/purchases/{purchase_id}/confirm")
async def confirm_purchase(
    purchase_id: str,
    viewer: ViewerDep,
    services: ServicesDep,
    payments: PaymentsDep,
) -> Viewer:
    store = services.store
    purchase = await _purchase(purchase_id, viewer, services)
    if purchase.status == "pending":
        try:
            paid = await payments.paid(purchase.id)
        except PaymentError as error:
            raise HTTPException(status_code=502, detail=str(error)) from error
        if not paid:
            raise HTTPException(status_code=409, detail="payment not finished")
        await store.wallets.settle_purchase(purchase)
    return await store.viewers.get(viewer.id)


def _pack(pack_id: str) -> CoinPack:
    pack = next((p for p in settings.coin_packs if p.id == pack_id), None)
    if pack is None:
        raise HTTPException(status_code=404, detail="pack not found")
    return pack


async def _purchase(
    purchase_id: str, viewer: Viewer, services: ServicesDep
) -> Purchase:
    try:
        purchase = await services.store.purchases.get(purchase_id)
    except NotFound:
        purchase = None
    if purchase is None or purchase.viewer_id != viewer.id:
        raise HTTPException(status_code=404, detail="purchase not found")
    return purchase
