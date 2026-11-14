from ai.render import render_appraisal, render_context
from domain import Event


def test_context_shows_only_what_the_agent_knows(context):
    prompt = render_context(context)

    assert "You are Mia (id 1). Bold and jealous." in prompt
    assert "Here with you: Jake (id 2)" in prompt
    assert "You can go to: kitchen (id 2)" in prompt
    assert "- Jake (id 2): affection 70, trust 40. flirty" in prompt
    assert "- [tick 2] Jake hugged me at the pool" in prompt
    assert "Sara" not in prompt


def test_appraisal_renders_any_event_kind(context):
    hug = Event(id=1, world_id=1, tick=3, kind="hug", actor_id=2, target_id=1)
    say = Event(
        id=2,
        world_id=1,
        tick=3,
        kind="say",
        actor_id=1,
        target_id=2,
        text="Again?",
        data={"emotion": "happy"},
    )

    prompt = render_appraisal(context, [hug, say])

    assert prompt.endswith(
        "What just happened:\n"
        "- Jake: hug (to Mia)\n"
        '- Mia: say "Again?" (to Jake, emotion: happy)'
    )
