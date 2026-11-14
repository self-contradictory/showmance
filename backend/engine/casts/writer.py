import asyncio
import dataclasses
import logging
from collections import deque

from ai import Writer
from ai.render import render_memory
from config import settings
from data import Store
from domain import (
    SPOKEN_KINDS,
    Action,
    Beat,
    Event,
    Line,
    Move,
    Reaction,
    SceneContext,
)
from engine.casts.base import Cast
from engine.context import scene_context
from engine.rules import takes_effect
from engine.state import WorldState

logger = logging.getLogger(__name__)

Playable = list[tuple[Line, Action]]


class WriterCast(Cast):
    def __init__(self, store: Store, writer: Writer) -> None:
        self._store = store
        self._writer = writer
        self._scripts: dict[int, deque[Beat]] = {}
        self._next_scene: dict[int, asyncio.Task[None]] = {}
        self._playing: dict[int, list[Line]] = {}

    async def act(
        self, state: WorldState, directions: dict[int, list[str]]
    ) -> dict[int, Action]:
        world_id = state.world.id
        if directions:
            self.replan(world_id)
        script = self._scripts.setdefault(world_id, deque())
        if not script:
            await self._refill(state, directions)
        playable = _next_playable(script, state)
        if not playable:
            return {}
        lines = [line for line, _ in playable]
        self._playing[world_id] = lines
        if len(script) <= settings.prefetch_beats and not self._writing(world_id):
            context = await scene_context(
                self._store, state, {}, upcoming=[Beat(lines=lines), *script]
            )
            self._next_scene[world_id] = asyncio.create_task(self._write(context))
        return {line.actor_id: action for line, action in playable}

    async def react(
        self, state: WorldState, seen: dict[int, list[Event]]
    ) -> dict[int, Reaction]:
        lines = self._playing.pop(state.world.id, [])
        return {
            agent_id: _reaction(state, agent_id, events, lines)
            for agent_id, events in seen.items()
        }

    def replan(self, world_id: int) -> None:
        self._scripts.pop(world_id, None)
        self._playing.pop(world_id, None)
        next_scene = self._next_scene.pop(world_id, None)
        if next_scene is not None:
            next_scene.cancel()

    async def _refill(
        self, state: WorldState, directions: dict[int, list[str]]
    ) -> None:
        next_scene = self._next_scene.pop(state.world.id, None)
        if next_scene is not None and not next_scene.done():
            await next_scene
            return
        await self._write(await scene_context(self._store, state, directions))

    def _writing(self, world_id: int) -> bool:
        next_scene = self._next_scene.get(world_id)
        return next_scene is not None and not next_scene.done()

    async def _write(self, context: SceneContext) -> None:
        try:
            scene = await self._writer.write(context)
        except Exception:
            logger.exception("writer failed for world %s", context.world.id)
            return
        self._scripts[context.world.id].extend(_new_beats(scene.beats, context))


def _next_playable(script: deque[Beat], state: WorldState) -> Playable:
    while script:
        playable = _play(script.popleft(), script, state)
        if playable:
            return playable
    return []


def _play(beat: Beat, script: deque[Beat], state: WorldState) -> Playable:
    after = dataclasses.replace(state)
    playable: Playable = []
    acting: set[int] = set()
    spoken = False
    for index, line in enumerate(beat.lines):
        speaks = line.kind in SPOKEN_KINDS
        if line.actor_id in acting or (speaks and spoken):
            script.appendleft(Beat(lines=beat.lines[index:]))
            break
        action = line.action()
        if (
            action is None
            or not after.has_agent(line.actor_id)
            or not takes_effect(action, after.agent(line.actor_id), after)
        ):
            continue
        playable.append((line, action))
        acting.add(line.actor_id)
        spoken = spoken or speaks
        if isinstance(action, Move):
            after.move(line.actor_id, action.destination_id)
    return playable


def _new_beats(beats: list[Beat], context: SceneContext) -> list[Beat]:
    written = {_content(line) for beat in context.upcoming for line in beat.lines}
    written |= {_spoken(e.actor_id, e.kind, e.text) for e in context.events if e.text}
    fresh = (
        Beat(lines=[line for line in beat.lines if _content(line) not in written])
        for beat in beats
    )
    return [beat for beat in fresh if beat.lines]


def _content(line: Line) -> tuple[object, ...]:
    if line.text:
        return _spoken(line.actor_id, line.kind, line.text)
    return (line.actor_id, line.kind, line.target_id, line.destination_id)


def _spoken(actor_id: int | None, kind: str, text: str) -> tuple[object, ...]:
    return (actor_id, kind, " ".join(text.lower().split()))


def _reaction(
    state: WorldState, agent_id: int, events: list[Event], lines: list[Line]
) -> Reaction:
    own = next((line for line in lines if line.actor_id == agent_id), None)
    return Reaction(
        mood=own.emotion if own is not None else state.agent(agent_id).mood,
        memory=render_memory(events, state.agents),
        changes=[f for line in lines for f in line.feelings if f.from_id == agent_id],
    )
