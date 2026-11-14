import pytest

from domain import Confess, FeelingChange, Hug, Move, Say, Wait
from engine.rules import can_feel, takes_effect, witnesses


@pytest.mark.parametrize(
    ("action", "expected"),
    [
        (Wait(), False),
        (Hug(target_id=2), True),
        (Hug(target_id=3), False),
        (Hug(target_id=1), False),
        (Say(text="hi", emotion="calm"), True),
        (Move(destination_id=2), True),
        (Move(destination_id=1), False),
        (Move(destination_id=9), False),
    ],
)
def test_what_takes_effect(state, action, expected):
    assert takes_effect(action, state.agent(1), state) is expected


def test_confessions_are_private_and_everything_else_is_public(state):
    mia = state.agent(1)

    assert witnesses(Confess(text="I like Jake"), mia, state) == [1]
    assert witnesses(Hug(target_id=2), mia, state) == [1, 2]


@pytest.mark.parametrize(("to_id", "expected"), [(2, True), (1, False), (9, False)])
def test_feelings_only_go_to_other_agents(state, to_id, expected):
    change = FeelingChange(to_id=to_id, affection_change=1, trust_change=1, note="")

    assert can_feel(change, state.agent(1), state) is expected
