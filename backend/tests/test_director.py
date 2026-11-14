from ai import LlmDirector
from ai.render import render_director, render_proposal
from domain import Proposal, Rejected, Reveal, TwistPlan


async def test_director_stages_a_plan(director_context, twist, fake_model):
    reply = {
        "summary": "Mia gets an anonymous text",
        "reveals": [{"text": "Jake kissed Sara", "to_ids": [1]}],
    }
    model, seen = fake_model(reply, tool_name="stage")

    outcome = await LlmDirector(model).stage(twist, director_context)

    assert outcome == TwistPlan(
        summary="Mia gets an anonymous text",
        reveals=[Reveal(text="Jake kissed Sara", to_ids=[1])],
    )
    assert seen["tools"] == {"stage", "reject"}
    assert seen["prompt"] == render_director(director_context, twist)


async def test_director_can_reject(director_context, twist, fake_model):
    model, _ = fake_model({"reason": "not fit for the show"}, tool_name="reject")

    outcome = await LlmDirector(model).stage(twist, director_context)

    assert outcome == Rejected(reason="not fit for the show")


async def test_director_proposes_a_poll(director_context, fake_model):
    reply = {
        "question": "Should Jake confess?",
        "options": [
            {"label": "Yes", "twist": "Jake confesses to Mia"},
            {"label": "No", "twist": "Jake keeps lying"},
        ],
    }
    model, seen = fake_model(reply)

    proposal = await LlmDirector(model).propose(director_context, "yes_no")

    assert proposal == Proposal.model_validate(reply)
    assert seen["prompt"] == render_proposal(director_context, "yes_no")
