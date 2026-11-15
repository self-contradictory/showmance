import pytest
from pydantic_ai import Agent
from pydantic_ai.exceptions import ModelQuotaExceededError
from pydantic_ai.messages import ModelResponse, TextPart
from pydantic_ai.models.fallback import FallbackModel
from pydantic_ai.models.function import FunctionModel

from ai import build_model
from ai.models import CooldownModel

LITE = "google:gemini-3.5-flash-lite"
FLASH = "google:gemini-3-flash-preview"


class Clock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def test_without_models_there_is_no_llm():
    assert build_model([], ["key"], 60) is None


def test_every_model_is_tried_with_every_key_in_order():
    model = build_model([LITE, FLASH], ["first", "second"], 60)

    assert isinstance(model, FallbackModel)
    pairs = [(m.model_name, m.wrapped.client._api_client.api_key) for m in model.models]
    assert pairs == [
        ("gemini-3.5-flash-lite", "first"),
        ("gemini-3.5-flash-lite", "second"),
        ("gemini-3-flash-preview", "first"),
        ("gemini-3-flash-preview", "second"),
    ]


def test_without_keys_the_provider_reads_its_own(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "from-env")

    model = build_model([LITE], [], 60)

    assert [m.wrapped.client._api_client.api_key for m in model.models] == ["from-env"]


@pytest.mark.parametrize(("retry_after", "rest"), [(30.0, 30.0), (None, 10.0)])
async def test_a_model_out_of_quota_rests_while_the_next_one_answers(
    retry_after, rest
):
    asked = []

    def spent(messages, info):
        asked.append("spent")
        raise ModelQuotaExceededError("spent", "daily quota", retry_after=retry_after)

    def answers(messages, info):
        return ModelResponse(parts=[TextPart("hi")])

    clock = Clock()
    agent = Agent(
        FallbackModel(
            CooldownModel(FunctionModel(spent), 10.0, clock),
            CooldownModel(FunctionModel(answers), 10.0, clock),
        )
    )

    for now in (0.0, 1.0, rest - 1):
        clock.now = now
        assert (await agent.run("hello")).output == "hi"
    assert asked == ["spent"]

    clock.now = rest + 1
    assert (await agent.run("hello")).output == "hi"
    assert asked == ["spent", "spent"]
