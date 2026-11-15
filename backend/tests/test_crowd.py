import random

from api.crowd import ANYTHING, NAMES, Crowd
from config import settings
from domain import NewPoll, PollOption


class FakeRunners:
    def __init__(self, running: set[int]) -> None:
        self.on = running

    def running(self, world_id: int) -> bool:
        return world_id in self.on


def crowd(store, running):
    return Crowd(store, FakeRunners(running), random.Random(7))


async def test_crowd_stays_quiet_while_a_world_is_off(store, villa, monkeypatch):
    monkeypatch.setattr(settings, "crowd_chat_chance", 1.0)

    await crowd(store, set()).cheer()

    assert await store.chat.recent(villa.world.id, 10) == []


async def test_crowd_chats_about_the_cast_while_a_world_runs(
    store, villa, monkeypatch
):
    monkeypatch.setattr(settings, "crowd_chat_chance", 1.0)
    talking = crowd(store, {villa.world.id})

    for _ in range(6):
        await talking.cheer()

    messages = await store.chat.recent(villa.world.id, 10)
    cast = ("Mia", "Jake", "Sara")
    assert len(messages) == 6
    assert {m.name for m in messages} <= set(NAMES)
    assert all(m.text in ANYTHING or any(n in m.text for n in cast) for m in messages)


async def test_crowd_votes_on_the_open_poll(store, villa, monkeypatch):
    monkeypatch.setattr(settings, "crowd_chat_chance", 0.0)
    monkeypatch.setattr(settings, "crowd_vote_chance", 1.0)
    poll = await store.polls.open(
        NewPoll(
            world_id=villa.world.id,
            question="Should Jake stay?",
            options=[PollOption(label=l, twist=l) for l in ("Yes", "No")],
            opened_tick=0,
            closes_tick=10,
        )
    )
    voting = crowd(store, {villa.world.id})

    for _ in range(8):
        await voting.cheer()

    assert 1 <= sum(await store.polls.tally(poll)) <= 8
