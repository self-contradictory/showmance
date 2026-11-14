from ai import LlmAppraiser
from ai.render import render_appraisal
from domain import Event, Reaction


async def test_appraiser_returns_the_reaction(context, fake_model):
    hug = Event(id=1, world_id=1, tick=3, kind="hug", actor_id=2, target_id=3)
    reply = {
        "mood": "jealous",
        "memory": "Jake hugged Sara right in front of me",
        "changes": [
            {"to_id": 2, "affection_change": -5, "trust_change": -10, "note": "fake"}
        ],
    }
    model, seen = fake_model(reply)

    reaction = await LlmAppraiser(model).appraise(context, [hug])

    assert reaction == Reaction.model_validate(reply)
    assert seen["prompt"] == render_appraisal(context, [hug])
