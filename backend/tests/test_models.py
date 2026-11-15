from pydantic_ai.models.fallback import FallbackModel

from ai import build_model

GEMINI = "google:gemini-3.5-flash-lite"


def test_without_keys_the_model_name_is_used_as_is():
    assert build_model(GEMINI, []) == GEMINI
    assert build_model(None, ["key"]) is None


def test_each_key_gets_its_own_model_tried_in_order():
    model = build_model(GEMINI, ["first", "second", "third"])

    assert isinstance(model, FallbackModel)
    assert [m.model_name for m in model.models] == ["gemini-3.5-flash-lite"] * 3
    assert [m.client._api_client.api_key for m in model.models] == [
        "first",
        "second",
        "third",
    ]
