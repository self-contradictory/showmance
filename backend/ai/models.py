import time
from collections.abc import Callable, Sequence

from pydantic_ai.exceptions import ModelQuotaExceededError, ModelRateLimitError
from pydantic_ai.messages import ModelMessage, ModelResponse
from pydantic_ai.models import Model, ModelRequestParameters, infer_model
from pydantic_ai.models.fallback import FallbackModel
from pydantic_ai.models.wrapper import WrapperModel
from pydantic_ai.providers import Provider, infer_provider, infer_provider_class
from pydantic_ai.settings import ModelSettings


class CooldownModel(WrapperModel):
    def __init__(
        self,
        wrapped: Model,
        cooldown: float,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        super().__init__(wrapped)
        self._cooldown = cooldown
        self._clock = clock
        self._ready_at = 0.0

    async def request(
        self,
        messages: list[ModelMessage],
        model_settings: ModelSettings | None,
        model_request_parameters: ModelRequestParameters,
    ) -> ModelResponse:
        wait = self._ready_at - self._clock()
        if wait > 0:
            raise ModelRateLimitError(
                self.model_name, "cooling down after a quota error", retry_after=wait
            )
        try:
            return await super().request(
                messages, model_settings, model_request_parameters
            )
        except (ModelRateLimitError, ModelQuotaExceededError) as error:
            self._ready_at = self._clock() + (error.retry_after or self._cooldown)
            raise


def build_model(
    names: Sequence[str], api_keys: Sequence[str], cooldown: float
) -> Model | None:
    providers = [_keyed(key) for key in api_keys] or [infer_provider]
    models = [
        CooldownModel(infer_model(name, provider_factory=provider), cooldown)
        for name in names
        for provider in providers
    ]
    return FallbackModel(*models) if models else None


def _keyed(api_key: str):
    def provider(provider_name: str) -> Provider:
        return infer_provider_class(provider_name)(api_key=api_key)

    return provider
