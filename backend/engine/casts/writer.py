import asyncio
import logging
from collections import deque

from ai import Writer
from ai.render import render_memory
from config import settings
from data import Store
from domain import Action, Event, Line, Reaction, SceneContext
from engine.casts.base import Cast
from engine.context import scene_context
from engine.rules import takes_effect
from engine.state import WorldState

logger = logging.getLogger(__name__)


class WriterCast(Cast):
    def __init__(self, store: Store, writer: Writer) -> None:
        self._store = store
        self._writer = writer
        self._scripts: dict[int, deque[Line]] = {}
        self._next_scene: dict[int, asyncio.Task[None]] = {}
        self._playing: dict[int, Line] = {}

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
        if playable is None:
            return {}
        line, action = playable
        self._playing[world_id] = line
        if len(script) <= settings.prefetch_lines and not self._writing(world_id):
            context = await scene_context(
                self._store, state, {}, upcoming=[line, *script]
            )
            self._next_scene[world_id] = asyncio.create_task(self._write(context))
        return {line.actor_id: action}

    async def react(
        self, state: WorldState, seen: dict[int, list[Event]]
    ) -> dict[int, Reaction]:
        line = self._playing.pop(state.world.id, None)
        return {
            agent_id: _reaction(state, agent_id, events, line)
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
        self._scripts[context.world.id].extend(_new_lines(scene.lines, context))


def _next_playable(
    script: deque[Line], state: WorldState
) -> tuple[Line, Action] | None:
    while script:
        line = script.popleft()
        action = line.action()
        if (
            action is not None
            and state.has_agent(line.actor_id)
            and takes_effect(action, state.agent(line.actor_id), state)
        ):
            return line, action
    return None


def _new_lines(lines: list[Line], context: SceneContext) -> list[Line]:
    written = {_content(line) for line in context.upcoming}
    written |= {_spoken(e.actor_id, e.kind, e.text) for e in context.events if e.text}
    return [line for line in lines if _content(line) not in written]


def _content(line: Line) -> tuple[object, ...]:
    if line.text:
        return _spoken(line.actor_id, line.kind, line.text)
    return (line.actor_id, line.kind, line.target_id, line.destination_id)


def _spoken(actor_id: int | None, kind: str, text: str) -> tuple[object, ...]:
    return (actor_id, kind, " ".join(text.lower().split()))


def _reaction(
    state: WorldState, agent_id: int, events: list[Event], line: Line | None
) -> Reaction:
    mood = state.agent(agent_id).mood
    changes = []
    if line is not None:
        if line.actor_id == agent_id:
            mood = line.emotion
        changes = [f for f in line.feelings if f.from_id == agent_id]
    return Reaction(
        mood=mood, memory=render_memory(events, state.agents), changes=changes
    )
