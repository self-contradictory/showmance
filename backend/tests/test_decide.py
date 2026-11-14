from ai import LlmDecider
from ai.render import render_context
from domain import Hug


async def test_decider_offers_every_action_and_returns_the_pick(context, fake_model):
    model, seen = fake_model({"target_id": 2}, tool_name="hug")

    action = await LlmDecider(model).decide(context)

    assert action == Hug(target_id=2)
    assert seen["tools"] == {"say", "hug", "kiss", "move", "confess", "wait"}
    assert seen["prompt"] == render_context(context)
