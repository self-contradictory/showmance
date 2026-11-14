import logging
from collections import deque

from ai import Writer
from ai.render import render_memory
from data import Store
from domain import Action, Event, Line, Reaction
from engine.casts.base import Cast
from engine.context import scene_context
from engine.state import WorldState

logger = logging.getLogger(__name__)


class WriterCast(Cast):
    def __init__(self, store: Store, writer: Writer) -> None:
        self._store = store
        self._writer = writer
        self._scripts: dict[int, deque[Line]] = {}
        self._playing: dict[int, Line] = {}

    async def act(
        self, state: WorldState, directions: dict[int, list[str]]
    ) -> dict[int, Action]:
        world_id = state.world.id
        if directions:
            self.replan(world_id)
        script = self._scripts.get(world_id)
        if not script:
            script = self._scripts[world_id] = deque(
                await self._write(state, directions)
            )
        while script:
            line = script.popleft()
            action = line.action()
            if action is not None and state.has_agent(line.actor_id):
                self._playing[world_id] = line
                return {line.actor_id: action}
        return {}

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

    async def _write(
        self, state: WorldState, directions: dict[int, list[str]]
    ) -> list[Line]:
        context = await scene_context(self._store, state, directions)
        try:
            scene = await self._writer.write(context)
        except Exception:
            logger.exception("writer failed for world %s", state.world.id)
            return []
        return scene.lines


def _reaction(
    state: WorldState, agent_id: int, events: list[Event], line: Line | None
) -> Reaction:
    mood = state.agent(agent_id).mood
    changes = []
    if line is not None:
        if line.actor_id == agent_id and line.emotion:
            mood = line.emotion
        changes = [f for f in line.feelings if f.from_id == agent_id]
    return Reaction(
        mood=mood, memory=render_memory(events, state.agents), changes=changes
    )
