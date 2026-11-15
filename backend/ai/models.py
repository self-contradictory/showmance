from collections.abc import Sequence

from pydantic_ai.models import Model, infer_model
from pydantic_ai.models.fallback import FallbackModel
from pydantic_ai.providers import Provider, infer_provider_class


def build_model(name: str | None, api_keys: Sequence[str]) -> Model | str | None:
    if name is None or not api_keys:
        return name
    models = [infer_model(name, provider_factory=_keyed(key)) for key in api_keys]
    return FallbackModel(*models)


def _keyed(api_key: str):
    def provider(provider_name: str) -> Provider:
        return infer_provider_class(provider_name)(api_key=api_key)

    return provider
