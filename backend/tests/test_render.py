from ai.render import (
    render_appraisal,
    render_context,
    render_director,
    render_proposal,
)
from domain import Event, Poll, PollOption


def test_context_shows_only_what_the_agent_knows(context):
    prompt = render_context(context)

    assert "You are Mia (id 1). Bold and jealous." in prompt
    assert "Here with you: Jake (id 2)" in prompt
    assert "You can go to: kitchen (id 2)" in prompt
    assert "- Jake (id 2): affection 70, trust 40. flirty" in prompt
    assert "- [tick 2] Jake hugged me at the pool" in prompt
    assert "Sara" not in prompt
    assert "producers" not in prompt


def test_context_shows_producer_directions(context):
    directed = context.model_copy(update={"directions": ["Confess to Jake"]})

    assert render_context(directed).endswith(
        "The producers need you to do this now:\n- Confess to Jake"
    )


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


def test_director_sees_the_whole_villa_and_the_twist(director_context, twist):
    prompt = render_director(director_context, twist)

    assert "- Sara (id 3), at kitchen, mood neutral." in prompt
    assert "- Mia → Jake: affection 70, trust 40. flirty" in prompt
    assert "- [tick 2] Jake: hug (to Mia)" in prompt
    assert prompt.endswith(
        "A viewer paid for this twist:\n<twist>\ntell Mia about the kiss\n</twist>"
    )


def test_director_sees_what_viewers_are_voting_on(director_context, twist):
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
    voting = director_context.model_copy(update={"poll": poll})

    prompt = render_director(voting, twist)

    assert (
        "Viewers are voting on: Should Jake confess?\n- Yes: Jake confesses" in prompt
    )


def test_proposal_asks_for_the_chosen_format(director_context):
    prompt = render_proposal(director_context, "three_options")

    assert "- Mia (id 1), at pool" in prompt
    assert prompt.endswith("Ask a question with exactly three options.")
