from config import Settings


def test_empty_values_fall_back_to_the_defaults(monkeypatch):
    for name in ("LLM_MODEL", "LLM_API_KEYS", "STRIPE_SECRET_KEY"):
        monkeypatch.setenv(name, "")

    settings = Settings()

    assert (settings.llm_model, settings.llm_api_keys, settings.stripe_secret_key) == (
        None,
        [],
        None,
    )


def test_api_keys_are_a_json_list(monkeypatch):
    monkeypatch.setenv("LLM_API_KEYS", '["first","second"]')

    assert Settings().llm_api_keys == ["first", "second"]
