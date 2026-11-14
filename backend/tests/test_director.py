from ai import LlmDirector
from ai.render import render_director, render_proposal
from domain import Poll, PollOption, Proposal, Rejected, Reveal, TwistPlan


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


async def test_director_can_reject_a_paid_twist(director_context, twist, fake_model):
    reply = {"reason": "not_fit_for_show", "explanation": "No fights with blood."}
    model, seen = fake_model(reply, tool_name="reject")

    outcome = await LlmDirector(model).stage(twist, director_context)

    assert outcome == Rejected(**reply)
    assert seen["tools"] == {"stage", "reject"}


async def test_voted_twists_can_only_be_staged(director_context, twist, fake_model):
    model, seen = fake_model({"summary": "The vote happens"}, tool_name="stage")
    voted = twist.model_copy(update={"source": "vote"})

    outcome = await LlmDirector(model).stage(voted, director_context)

    assert outcome == TwistPlan(summary="The vote happens")
    assert seen["tools"] == {"stage"}


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


async def test_director_checks_a_twist_against_the_vote(
    director_context, twist, fake_model
):
    model, _ = fake_model({"decides_vote": True})
    poll = Poll(
        id=1,
        world_id=1,
        question="Should Jake confess?",
        options=[
            PollOption(label="Yes", twist="Jake confesses"),
            PollOption(label="No", twist="Jake lies"),
        ],
        opened_tick=1,
        closes_tick=10,
        status="open",
        winner=None,
    )

    assert await LlmDirector(model).decides_vote(twist, poll) is True
