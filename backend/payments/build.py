from config import settings
from payments.base import Payments
from payments.stripe_payments import StripePayments


def build_payments(secret_key: str | None) -> Payments | None:
    if not secret_key:
        return None
    return StripePayments(secret_key, settings.currency)
