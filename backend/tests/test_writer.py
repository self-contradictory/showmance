import asyncio
from types import SimpleNamespace
from typing import get_args

from ai import LlmWriter, llm_roles
from ai.render import render_scene
from config import settings
from domain import (
    Action,
    Beat,
    Confess,
    Kiss,
    Line,
    LineKind,
    Move,
    NewTwist,
    Perform,
    Say,
    Scene,
    SceneContext,
    ScriptedFeeling,
    TwistPlan,
    action_kind,
)
from engine.casts import (
    AgentsCast,
    Parallel,
    Sequential,
    WriterCast,
    build_cast,
    build_pacing,
)


def say(agent, text, **fields):
    return Line(actor_id=agent.id, kind="say", text=text, emotion="happy", **fields)


def scene(*beats):
    return Scene(
        beats=[Beat(lines=b if isinstance(b, list) else [b]) for b in beats]
    )


class GatedWriter:
    def __init__(self, scenes: dict[int, Scene], gated: int) -> None:
        self._scenes = scenes
        self._gated = gated
        self.gate = asyncio.Event()
        self.cancelled = False
        self.contexts: list[SceneContext] = []

    async def write(self, context: SceneContext) -> Scene:
        self.contexts.append(context)
        call = len(self.contexts)
        if call == self._gated:
            try:
                await self.gate.wait()
            except asyncio.CancelledError:
                self.cancelled = True
                raise
        return self._scenes.get(call, scene())


async def test_scene_plays_one_beat_per_tick(store, memory, villa, writer_sim):
    v = villa
    crush = ScriptedFeeling(
        from_id=v.jake.id,
        to_id=v.mia.id,
        affection_change=5,
        trust_change=0,
        note="she noticed me",
    )
    hi = Line(
        actor_id=v.mia.id,
        kind="say",
        text="Hi",
        emotion="flirty",
        target_id=v.jake.id,
        feelings=[crush],
    )
    hug = Line(actor_id=v.jake.id, kind="hug", target_id=v.mia.id, emotion="smitten")
    s = writer_sim([scene(hi, hug)])

    [first] = await s.engine.step(v.world.id)
    [second] = await s.engine.step(v.world.id)

    assert [(e.kind, e.actor_id) for e in (first, second)] == [
        ("say", v.mia.id),
        ("hug", v.jake.id),
    ]
    [feeling] = await store.relationships.get_all(v.world.id)
    assert (feeling.from_id, feeling.to_id, feeling.affection) == (
        v.jake.id,
        v.mia.id,
        settings.neutral_score + 5,
    )
    moods = {a.name: a.mood for a in await store.agents.get_all(v.world.id)}
    assert (moods["Mia"], moods["Jake"], moods["Sara"]) == (
        "flirty",
        "smitten",
        settings.default_mood,
    )
    assert [m.text for m in await memory.recall(v.jake.id, "")] == [
        'Mia: say "Hi" (to Jake, emotion: flirty)',
        "Jake: hug (to Mia)",
    ]
    assert await memory.recall(v.sara.id, "") == []


async def test_next_scene_is_written_while_the_last_lines_play(
    villa, writer_sim, monkeypatch
):
    monkeypatch.setattr(settings, "prefetch_beats", 1)
    v = villa
    s = writer_sim(
        [
            scene(say(v.mia, "One"), say(v.mia, "Two"), say(v.mia, "Three")),
            scene(say(v.jake, "Four")),
        ]
    )

    await s.engine.step(v.world.id)
    assert len(s.writer.contexts) == 1
    played = [await s.engine.step(v.world.id) for _ in range(3)]

    assert [e.text for events in played for e in events] == ["Two", "Three", "Four"]
    ahead = s.writer.contexts[1]
    assert [line.text for beat in ahead.upcoming for line in beat.lines] == [
        "Two",
        "Three",
    ]
    assert [e.text for e in ahead.events] == ["One"]


async def test_next_scene_does_not_repeat_what_was_already_written(
    villa, writer_sim, monkeypatch
):
    monkeypatch.setattr(settings, "prefetch_beats", 1)
    v = villa
    aired = Line(actor_id=v.mia.id, kind="say", text=" one", emotion="sad")
    upcoming = Line(
        actor_id=v.mia.id, kind="say", text="Three", emotion="sad", target_id=v.jake.id
    )
    s = writer_sim(
        [
            scene(say(v.mia, "One"), say(v.mia, "Two"), say(v.mia, "Three")),
            scene(aired, upcoming, say(v.jake, "Four")),
        ]
    )

    played = [await s.engine.step(v.world.id) for _ in range(5)]

    assert [e.text for events in played for e in events] == [
        "One",
        "Two",
        "Three",
        "Four",
    ]


async def test_running_out_waits_for_the_scene_being_written(villa, writer_sim):
    v = villa
    writer = GatedWriter(
        {1: scene(say(v.mia, "One")), 2: scene(say(v.jake, "Two"))},
        gated=2,
    )
    s = writer_sim(writer=writer)
    await s.engine.step(v.world.id)

    step = asyncio.create_task(s.engine.step(v.world.id))
    await asyncio.sleep(0.1)
    assert not step.done()
    writer.gate.set()
    [two] = await step

    assert two.text == "Two"
    assert [bool(c.upcoming) for c in writer.contexts] == [False, True, True]


async def test_twist_replaces_the_rest_of_the_scene(store, villa, writer_sim):
    v = villa
    plan = TwistPlan(
        summary="Jake's ex walks in",
        performs=[
            Perform(agent_id=v.jake.id, instruction="Pretend you don't know her")
        ],
    )
    s = writer_sim(
        [
            scene(say(v.mia, "One"), say(v.mia, "Two")),
            scene(say(v.mia, "Stale")),
            scene(say(v.jake, "Who's that?")),
        ],
        plans={"bring the ex": plan},
    )
    await s.engine.step(v.world.id)
    await store.twists.add(
        NewTwist(world_id=v.world.id, text="bring the ex", source="vote")
    )

    events = await s.engine.step(v.world.id)

    assert [(e.kind, e.text) for e in events] == [
        ("twist", "Jake's ex walks in"),
        ("say", "Who's that?"),
    ]
    assert s.writer.contexts[2].directions == {
        v.jake.id: ["Pretend you don't know her"]
    }
    assert await s.engine.step(v.world.id) == []


async def test_twist_cancels_the_scene_being_written(store, villa, writer_sim):
    v = villa
    writer = GatedWriter(
        {
            1: scene(say(v.mia, "One"), say(v.mia, "Two")),
            3: scene(say(v.jake, "Fresh")),
        },
        gated=2,
    )
    s = writer_sim(
        writer=writer, plans={"bring the ex": TwistPlan(summary="Jake's ex walks in")}
    )
    await s.engine.step(v.world.id)
    await store.twists.add(
        NewTwist(world_id=v.world.id, text="bring the ex", source="vote")
    )

    events = await s.engine.step(v.world.id)

    assert [e.text for e in events] == ["Jake's ex walks in", "Fresh"]
    assert writer.cancelled


async def test_lines_that_cannot_happen_do_not_use_up_a_tick(store, villa, writer_sim):
    v = villa
    longing = ScriptedFeeling(
        from_id=v.sara.id,
        to_id=v.jake.id,
        affection_change=5,
        trust_change=0,
        note="he came for me",
    )
    s = writer_sim(
        [
            scene(
                Line(actor_id=v.mia.id, kind="say", emotion="shy"),
                say(SimpleNamespace(id=999), "Who am I?"),
                Line(
                    actor_id=v.jake.id,
                    kind="kiss",
                    target_id=v.sara.id,
                    emotion="bold",
                    feelings=[longing],
                ),
                Line(
                    actor_id=v.mia.id,
                    kind="move",
                    destination_id=v.pool.id,
                    emotion="bored",
                ),
                say(v.mia, "Hi"),
            )
        ]
    )

    [hi] = await s.engine.step(v.world.id)

    assert hi.text == "Hi"
    assert await store.relationships.get_all(v.world.id) == []


async def test_everyone_in_a_beat_acts_in_the_same_tick(store, villa, writer_sim):
    v = villa
    s = writer_sim(
        [
            scene(
                [
                    say(v.mia, "Look who's here", target_id=v.jake.id),
                    Line(
                        actor_id=v.sara.id,
                        kind="move",
                        destination_id=v.pool.id,
                        emotion="curious",
                    ),
                    Line(
                        actor_id=v.jake.id,
                        kind="hug",
                        target_id=v.mia.id,
                        emotion="warm",
                    ),
                ],
                say(v.jake, "Later"),
            )
        ]
    )

    events = await s.engine.step(v.world.id)

    assert [(e.kind, e.actor_id, e.tick) for e in events] == [
        ("say", v.mia.id, 1),
        ("move", v.sara.id, 1),
        ("hug", v.jake.id, 1),
    ]
    moods = {a.name: a.mood for a in await store.agents.get_all(v.world.id)}
    assert (moods["Mia"], moods["Sara"], moods["Jake"]) == ("happy", "curious", "warm")


async def test_lines_in_a_beat_play_in_order(store, villa, writer_sim):
    v = villa
    s = writer_sim(
        [
            scene(
                [
                    Line(
                        actor_id=v.sara.id,
                        kind="move",
                        destination_id=v.pool.id,
                        emotion="bold",
                    ),
                    Line(
                        actor_id=v.jake.id,
                        kind="kiss",
                        target_id=v.sara.id,
                        emotion="smitten",
                    ),
                ]
            )
        ]
    )

    events = await s.engine.step(v.world.id)

    assert [(e.kind, e.actor_id) for e in events] == [
        ("move", v.sara.id),
        ("kiss", v.jake.id),
    ]


async def test_a_second_line_for_someone_waits_for_the_next_beat(villa, writer_sim):
    v = villa
    s = writer_sim(
        [
            scene(
                [
                    Line(
                        actor_id=v.mia.id,
                        kind="move",
                        destination_id=v.kitchen.id,
                        emotion="sneaky",
                    ),
                    say(v.jake, "Where are you going?"),
                    say(v.mia, "Hey Sara", target_id=v.sara.id),
                ]
            )
        ]
    )

    first = await s.engine.step(v.world.id)
    second = await s.engine.step(v.world.id)

    assert [e.kind for e in first] == ["move", "say"]
    assert [e.text for e in second] == ["Hey Sara"]


async def test_only_one_person_speaks_in_a_beat(villa, writer_sim):
    v = villa
    s = writer_sim([scene([say(v.mia, "One"), say(v.jake, "Two")])])

    first = await s.engine.step(v.world.id)
    second = await s.engine.step(v.world.id)

    assert [e.text for e in first] == ["One"]
    assert [e.text for e in second] == ["Two"]


async def test_sequential_pacing_plays_one_line_per_tick(villa, writer_sim):
    v = villa
    s = writer_sim(
        [
            scene(
                [
                    say(v.mia, "One"),
                    Line(
                        actor_id=v.sara.id,
                        kind="move",
                        destination_id=v.pool.id,
                        emotion="bored",
                    ),
                    Line(
                        actor_id=v.jake.id,
                        kind="hug",
                        target_id=v.mia.id,
                        emotion="warm",
                    ),
                ]
            )
        ],
        pacing="sequential",
    )

    played = [await s.engine.step(v.world.id) for _ in range(3)]

    assert [[(e.kind, e.actor_id) for e in events] for events in played] == [
        [("say", v.mia.id)],
        [("move", v.sara.id)],
        [("hug", v.jake.id)],
    ]


async def test_writer_is_told_how_beats_play(villa, writer_sim):
    s = writer_sim([scene(say(villa.mia, "Hi"))], pacing="sequential")

    await s.engine.step(villa.world.id)

    assert s.writer.contexts[0].beat_rules == list(Sequential.rules)


async def test_failed_writer_call_skips_the_tick(villa, writer_sim):
    s = writer_sim([RuntimeError("model down"), scene(say(villa.mia, "Back"))])

    assert await s.engine.step(villa.world.id) == []
    [back] = await s.engine.step(villa.world.id)

    assert back.text == "Back"


def test_every_line_kind_is_an_action():
    kinds = {action_kind(action) for action in get_args(Action)} - {"wait"}

    assert set(get_args(LineKind)) == kinds


def test_lines_become_actions():
    def line(kind, **fields):
        return Line(actor_id=1, kind=kind, emotion="shy", **fields)

    assert line("say", text="Hi").action() == Say(text="Hi", emotion="shy")
    assert line("move", destination_id=2).action() == Move(destination_id=2)
    assert line("confess", text="I lied").action() == Confess(text="I lied")
    assert line("kiss").action() is None


async def test_llm_writer_returns_the_scene(director_context, fake_model):
    context = SceneContext(**dict(director_context))
    kiss = {"actor_id": 1, "kind": "kiss", "target_id": 2, "emotion": "bold"}
    model, seen = fake_model({"beats": [{"lines": [kiss]}]})

    written = await LlmWriter(model).write(context)

    assert [line.action() for line in written.beats[0].lines] == [Kiss(target_id=2)]
    assert seen["prompt"] == render_scene(context)


def test_pacing_setting_picks_how_beats_play():
    assert isinstance(build_pacing("parallel"), Parallel)
    assert isinstance(build_pacing("sequential"), Sequential)


def test_cast_setting_picks_who_plays_the_contestants(store, memory):
    roles = llm_roles(None)

    assert isinstance(build_cast("agents", roles, store, memory), AgentsCast)
    assert isinstance(build_cast("writer", roles, store, memory), WriterCast)
