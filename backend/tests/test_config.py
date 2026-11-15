from config import Settings


def test_empty_values_fall_back_to_the_defaults(monkeypatch):
    for name in ("LLM_MODELS", "LLM_API_KEYS", "STRIPE_SECRET_KEY"):
        monkeypatch.setenv(name, "")

    settings = Settings()

    assert (settings.llm_models, settings.llm_api_keys, settings.stripe_secret_key) == (
        [],
        [],
        None,
    )


def test_models_and_api_keys_are_json_lists(monkeypatch):
    monkeypatch.setenv("LLM_MODELS", '["google:lite","google:flash"]')
    monkeypatch.setenv("LLM_API_KEYS", '["first","second"]')

    settings = Settings()

    assert settings.llm_models == ["google:lite", "google:flash"]
    assert settings.llm_api_keys == ["first", "second"]
