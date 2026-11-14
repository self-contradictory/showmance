from ai import LlmDirector
from ai.render import render_director
from domain import Rejected, Reveal, TwistPlan


async def test_director_stages_a_plan(director_context, fake_model):
    reply = {
        "summary": "Mia gets an anonymous text",
        "reveals": [{"text": "Jake kissed Sara", "to_ids": [1]}],
    }
    model, seen = fake_model(reply, tool_name="stage")

    outcome = await LlmDirector(model).stage("tell Mia", director_context)

    assert outcome == TwistPlan(
        summary="Mia gets an anonymous text",
        reveals=[Reveal(text="Jake kissed Sara", to_ids=[1])],
    )
    assert seen["tools"] == {"stage", "reject"}
    assert seen["prompt"] == render_director(director_context, "tell Mia")


async def test_director_can_reject(director_context, fake_model):
    model, _ = fake_model({"reason": "not fit for the show"}, tool_name="reject")

    outcome = await LlmDirector(model).stage("burn it down", director_context)

    assert outcome == Rejected(reason="not fit for the show")
