import random

from config import POLL_TICKS
from domain import NewPoll, PollOption, Proposal, Reveal, TwistPlan


def options(*labels):
    return [PollOption(label=label, twist=f"{label} happens") for label in labels]


async def open_poll(store, villa, closes_tick=5):
    return await store.polls.open(
        NewPoll(
            world_id=villa.world.id,
            question="What happens next?",
            options=options("A", "B"),
            opened_tick=0,
            closes_tick=closes_tick,
        )
    )


async def join(http, name):
    token = (await http.post("/viewers", json={"name": name})).json()["token"]
    return {"Authorization": f"Bearer {token}"}


async def test_each_viewer_has_one_vote_and_can_change_it(store, villa):
    poll = await open_poll(store, villa)
    ann, _ = await store.viewers.create("Ann")
    bob, _ = await store.viewers.create("Bob")

    await store.polls.vote(poll.id, ann.id, 0)
    await store.polls.vote(poll.id, bob.id, 0)
    await store.polls.vote(poll.id, bob.id, 1)

    assert await store.polls.tally(poll) == [1, 1]
    assert await store.polls.current(villa.world.id) == poll


async def test_yes_no_poll_gets_yes_and_no_labels(store, villa, sim, monkeypatch):
    monkeypatch.setattr(random, "choice", lambda _: "yes_no")
    proposal = Proposal(question="Should Jake confess?", options=options("Sure", "Nah"))
    s = sim(proposal=proposal)

    events = await s.engine.step(villa.world.id)

    poll = await store.polls.current(villa.world.id)
    assert [option.label for option in poll.options] == ["Yes", "No"]
    assert [option.twist for option in poll.options] == ["Sure happens", "Nah happens"]
    assert (poll.opened_tick, poll.closes_tick) == (1, 1 + POLL_TICKS)
    assert [(e.kind, e.text) for e in events] == [
        ("poll_opened", "Should Jake confess?")
    ]


async def test_wrong_number_of_options_opens_no_poll(store, villa, sim, monkeypatch):
    monkeypatch.setattr(random, "choice", lambda _: "three_options")
    s = sim(proposal=Proposal(question="Pick one", options=options("A", "B")))

    assert await s.engine.step(villa.world.id) == []
    assert await store.polls.current(villa.world.id) is None
    assert s.director.formats == ["three_options"]


async def test_winning_option_is_staged_in_the_same_tick(store, villa, sim):
    poll = await open_poll(store, villa, closes_tick=1)
    ann, _ = await store.viewers.create("Ann")
    bob, _ = await store.viewers.create("Bob")
    await store.polls.vote(poll.id, ann.id, 1)
    await store.polls.vote(poll.id, bob.id, 1)
    plan = TwistPlan(
        summary="B happened",
        reveals=[Reveal(text="news", to_ids=[villa.mia.id])],
    )
    s = sim(plans={"B happens": plan})

    events = await s.engine.step(villa.world.id)

    assert [(e.kind, e.text) for e in events] == [
        ("poll_closed", "B"),
        ("twist", "B happened"),
        ("reveal", "news"),
    ]
    assert await store.polls.current(villa.world.id) is None
    twist_id = events[1].data["twist_id"]
    twist = await store.twists.get(twist_id)
    assert (twist.source, twist.poll_id, twist.status) == ("vote", poll.id, "staged")


async def test_viewers_vote_through_the_api(store, villa, sim, client):
    world = f"/worlds/{villa.world.id}"
    async with client(sim().engine) as http:
        nothing = await http.get(f"{world}/poll")
        no_poll = await http.post(
            f"{world}/poll/vote", json={"option": 0}, headers=await join(http, "Zoe")
        )
        await open_poll(store, villa)
        ann = await join(http, "Ann")
        anonymous = await http.post(f"{world}/poll/vote", json={"option": 0})
        too_big = await http.post(f"{world}/poll/vote", json={"option": 2}, headers=ann)
        voted = await http.post(f"{world}/poll/vote", json={"option": 1}, headers=ann)
        current = (await http.get(f"{world}/poll")).json()

    assert (nothing.status_code, nothing.json()) == (200, None)
    assert no_poll.status_code == 404
    assert (anonymous.status_code, too_big.status_code) == (401, 422)
    assert voted.status_code == 204
    assert current["votes"] == [0, 1]
