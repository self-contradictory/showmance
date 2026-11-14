from config import NEUTRAL_SCORE
from domain import Confess, FeelingChange, Hug, Kiss, Move, NewEvent, Reaction, Say


async def test_hug_is_seen_and_felt_only_in_the_room(store, memory, villa, sim):
    v = villa
    mia_reaction = Reaction(
        mood="happy",
        memory="Jake hugged me",
        changes=[
            FeelingChange(
                to_id=v.jake.id, affection_change=5, trust_change=2, note="sweet"
            )
        ],
    )
    engine, appraiser = sim({"Jake": Hug(target_id=v.mia.id)}, {"Mia": mia_reaction})

    [hug] = await engine.step(v.world.id)

    assert (hug.kind, hug.actor_id, hug.target_id, hug.tick) == (
        "hug",
        v.jake.id,
        v.mia.id,
        1,
    )
    assert set(hug.witness_ids) == {v.mia.id, v.jake.id}
    assert appraiser.seen == {"Mia": ["hug"], "Jake": ["hug"]}
    assert [m.text for m in await memory.recall(v.mia.id, "")] == ["Jake hugged me"]
    assert await memory.recall(v.sara.id, "") == []
    [feeling] = await store.relationships.get_all(v.world.id)
    assert (feeling.from_id, feeling.to_id, feeling.affection, feeling.note) == (
        v.mia.id,
        v.jake.id,
        NEUTRAL_SCORE + 5,
        "sweet",
    )
    moods = {a.name: a.mood for a in await store.agents.get_all(v.world.id)}
    assert moods["Mia"] == "happy"


async def test_action_toward_someone_elsewhere_is_dropped(villa, sim):
    engine, appraiser = sim({"Jake": Kiss(target_id=villa.sara.id)})

    assert await engine.step(villa.world.id) == []
    assert appraiser.seen == {}


async def test_move_is_seen_where_it_started(store, villa, sim):
    v = villa
    engine, appraiser = sim({"Mia": Move(destination_id=v.kitchen.id)})

    [move] = await engine.step(v.world.id)

    assert (move.location_id, move.data) == (
        v.pool.id,
        {"destination_id": v.kitchen.id},
    )
    assert set(appraiser.seen) == {"Mia", "Jake"}
    agents = {a.name: a for a in await store.agents.get_all(v.world.id)}
    assert agents["Mia"].location_id == v.kitchen.id


async def test_confession_is_private(villa, sim):
    engine, appraiser = sim({"Mia": Confess(text="I like Jake")})

    [confession] = await engine.step(villa.world.id)

    assert confession.witness_ids == [villa.mia.id]
    assert appraiser.seen == {"Mia": ["confess"]}


async def test_failed_model_call_does_not_stop_the_tick(villa, sim):
    engine, _ = sim(
        {"Jake": RuntimeError("model down"), "Mia": Say(text="Hi", emotion="happy")}
    )

    [say] = await engine.step(villa.world.id)

    assert (say.actor_id, say.text) == (villa.mia.id, "Hi")


async def test_injected_twist_makes_witnesses_react(memory, villa, sim):
    v = villa
    shock = Reaction(mood="furious", memory="Jake kissed Sara?!", changes=[])
    engine, appraiser = sim({}, {"Mia": shock})
    twist = NewEvent(
        world_id=v.world.id,
        tick=0,
        kind="secret",
        target_id=v.mia.id,
        text="Jake kissed Sara",
        witness_ids=[v.mia.id],
    )

    await engine.inject(twist)

    assert appraiser.seen == {"Mia": ["secret"]}
    assert [m.text for m in await memory.recall(v.mia.id, "")] == ["Jake kissed Sara?!"]
