from config import TWIST_FAILED_REASON
from domain import (
    Announce,
    Arrive,
    NewTwist,
    Nudge,
    Perform,
    Reaction,
    Rejected,
    Relocate,
    Reveal,
    TwistPlan,
)


async def send(store, villa, text):
    return await store.twists.add(
        NewTwist(world_id=villa.world.id, text=text, source="vote")
    )


async def test_reveal_lands_before_anyone_decides(store, villa, sim):
    v = villa
    plan = TwistPlan(
        summary="Mia gets an anonymous text",
        reveals=[Reveal(text="Jake kissed Sara", to_ids=[v.mia.id])],
    )
    shock = Reaction(mood="furious", memory="A text says Jake kissed Sara", changes=[])
    s = sim(reactions={"Mia": shock}, plans={"tell Mia about the kiss": plan})
    twist = await send(store, v, "tell Mia about the kiss")

    events = await s.engine.step(v.world.id)

    assert [(e.kind, e.witness_ids) for e in events] == [
        ("twist", []),
        ("reveal", [v.mia.id]),
    ]
    assert all(e.data["twist_id"] == twist.id for e in events)
    mia = s.decider.contexts["Mia"]
    assert [m.text for m in mia.memories] == ["A text says Jake kissed Sara"]
    assert mia.agent.mood == "furious"
    staged = await store.twists.get(twist.id)
    assert (staged.status, staged.outcome, staged.tick) == (
        "staged",
        "Mia gets an anonymous text",
        1,
    )


async def test_new_arrival_is_seen_and_joins_the_tick(store, villa, sim):
    v = villa
    plan = TwistPlan(
        summary="A tempter arrives for Jake",
        arrivals=[
            Arrive(name="Alex", persona="Here to test Jake.", location_id=v.pool.id)
        ],
    )
    s = sim(plans={"send a tempter": plan})
    await send(store, v, "send a tempter")

    events = await s.engine.step(v.world.id)

    arrive = next(e for e in events if e.kind == "arrive")
    agents = {a.name: a for a in await store.agents.get_all(v.world.id)}
    assert agents["Alex"].location_id == v.pool.id
    assert set(arrive.witness_ids) == {v.mia.id, v.jake.id, agents["Alex"].id}
    assert "Alex" in s.decider.contexts


async def test_relocation_and_direction_set_up_a_date(store, villa, sim):
    v = villa
    plan = TwistPlan(
        summary="Jake is sent to ask Sara out",
        relocations=[Relocate(agent_id=v.jake.id, destination_id=v.kitchen.id)],
        performs=[Perform(agent_id=v.jake.id, instruction="Ask Sara on a date")],
    )
    s = sim(plans={"date for Jake and Sara": plan})
    await send(store, v, "date for Jake and Sara")

    await s.engine.step(v.world.id)

    jake = s.decider.contexts["Jake"]
    assert jake.agent.location_id == v.kitchen.id
    assert jake.directions == ["Ask Sara on a date"]
    assert s.decider.contexts["Mia"].directions == []


async def test_announcement_and_nudge_reach_the_right_people(store, villa, sim):
    v = villa
    plan = TwistPlan(
        summary="A vote is coming and Mia feels uneasy",
        announcements=[Announce(text="Tonight someone goes home")],
        nudges=[Nudge(agent_id=v.mia.id, text="You feel Jake is hiding something")],
    )
    s = sim(plans={"stir things up": plan})
    await send(store, v, "stir things up")

    events = await s.engine.step(v.world.id)

    witnesses = {e.kind: set(e.witness_ids) for e in events}
    assert witnesses["announce"] == {v.mia.id, v.jake.id, v.sara.id}
    assert witnesses["nudge"] == {v.mia.id}
    assert s.appraiser.seen["Mia"] == ["announce", "nudge"]


async def test_rejected_twist_changes_nothing(store, villa, sim):
    s = sim(plans={"burn the villa down": Rejected(reason="Not fit for the show")})
    twist = await send(store, villa, "burn the villa down")

    assert await s.engine.step(villa.world.id) == []
    rejected = await store.twists.get(twist.id)
    assert (rejected.status, rejected.outcome) == ("rejected", "Not fit for the show")


async def test_director_failure_rejects_the_twist(store, villa, sim):
    s = sim(plans={"anything": RuntimeError("model down")})
    twist = await send(store, villa, "anything")

    await s.engine.step(villa.world.id)

    failed = await store.twists.get(twist.id)
    assert (failed.status, failed.outcome) == ("rejected", TWIST_FAILED_REASON)


async def test_invalid_targets_are_skipped(store, villa, sim):
    plan = TwistPlan(
        summary="Nobody gets the message",
        reveals=[Reveal(text="secret", to_ids=[999])],
        relocations=[Relocate(agent_id=villa.mia.id, destination_id=999)],
    )
    s = sim(plans={"bad ids": plan})
    await send(store, villa, "bad ids")

    events = await s.engine.step(villa.world.id)

    assert [e.kind for e in events] == ["twist"]
