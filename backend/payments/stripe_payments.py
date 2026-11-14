from stripe import StripeClient, StripeError

from config import CoinPack
from domain import Viewer
from payments.base import Checkout, PaymentError, Payments

PAID = ("paid", "no_payment_required")


class StripePayments(Payments):
    def __init__(self, secret_key: str, currency: str) -> None:
        self._sessions = StripeClient(secret_key).v1.checkout.sessions
        self._currency = currency

    async def checkout(self, pack: CoinPack, viewer: Viewer) -> Checkout:
        try:
            session = await self._sessions.create_async(
                params={
                    "mode": "payment",
                    "ui_mode": "embedded_page",
                    "redirect_on_completion": "never",
                    "allowed_payment_method_types": ["card"],
                    "client_reference_id": str(viewer.id),
                    "metadata": {"viewer_id": str(viewer.id), "pack_id": pack.id},
                    "line_items": [
                        {
                            "quantity": 1,
                            "price_data": {
                                "currency": self._currency,
                                "unit_amount": pack.price_cents,
                                "product_data": {"name": f"{pack.coins:,} coins"},
                            },
                        }
                    ],
                }
            )
        except StripeError as error:
            raise PaymentError(str(error)) from error
        if session.client_secret is None:
            raise PaymentError("checkout has no client secret")
        return Checkout(id=session.id, client_secret=session.client_secret)

    async def paid(self, checkout_id: str) -> bool:
        try:
            session = await self._sessions.retrieve_async(checkout_id)
        except StripeError as error:
            raise PaymentError(str(error)) from error
        return session.payment_status in PAID
