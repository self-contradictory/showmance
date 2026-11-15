import asyncio
import logging
import random

from api.runners import Runners
from config import settings
from data import Store
from domain import Agent, Event, NewChatMessage, Poll, Viewer

logger = logging.getLogger(__name__)

NAMES = (
    "dee",
    "jess_k",
    "ben_t",
    "priya",
    "tina",
    "sam_r",
    "carlos.v",
    "mike88",
    "lena",
    "noah.j",
    "zoe_m",
    "aiko",
)

ABOUT = (
    "{a} is playing everyone",
    "team {a} all the way",
    "{a} and {b} are endgame",
    "{a} needs to go home",
    "why is {a} like this lol",
    "not {a} acting innocent",
    "{a} deserves better than {b}",
    "the way {a} looked at {b}",
    "{a} is the only real one in there",
    "{a} and {b} are so fake",
    "protect {a} at all costs",
    "{b} has no idea what {a} is planning",
    "{a} is giving villain",
    "i trust {a} less every minute",
)

REACTIONS = {
    "kiss": (
        "{a} and {b}!!!",
        "{a} kissed {b} omg",
        "THE KISS",
        "not the kiss 😭",
    ),
    "hug": ("{a} and {b} are cute ngl", "that hug meant something", "{a} hugging {b} 👀"),
    "move": ("where is {a} going", "{a} walked out lol", "{a} is up to something"),
    "twist": ("who paid for that twist 😂", "the twist!!", "best twist so far"),
}

ANYTHING = (
    "this is better than tv",
    "the drama 😭",
    "who else is staying up for this",
    "PLOT TWIST",
    "i can't look away",
    "someone drop a twist already",
    "first time here, already hooked",
    "chat is wild today",
    "omg",
    "NO WAY",
)


class Crowd:
    def __init__(
        self, store: Store, runners: Runners, rng: random.Random | None = None
    ) -> None:
        self._store = store
        self._runners = runners
        self._rng = rng or random.Random()
        self._members: list[Viewer] = []
        self._leanings: dict[int, list[float]] = {}

    async def run(self) -> None:
        while True:
            try:
                await self.cheer()
            except Exception:
                logger.exception("crowd failed")
            await asyncio.sleep(settings.crowd_interval)

    async def cheer(self) -> None:
        for world in await self._store.worlds.get_all():
            if not self._runners.running(world.id):
                continue
            if self._rng.random() < settings.crowd_chat_chance:
                await self._chat(world.id)
            poll = await self._store.polls.current(world.id)
            if poll is not None and self._rng.random() < settings.crowd_vote_chance:
                await self._vote(poll)

    async def _chat(self, world_id: int) -> None:
        agents = await self._store.agents.get_all(world_id)
        events = await self._store.events.recent(world_id, 5)
        member = self._rng.choice(await self._crowd())
        await self._store.chat.add(
            NewChatMessage(
                world_id=world_id,
                viewer_id=member.id,
                name=member.name,
                text=self._line(agents, events),
            )
        )

    async def _vote(self, poll: Poll) -> None:
        leaning = self._leanings.setdefault(
            poll.id, [self._rng.random() ** 2 + 0.05 for _ in poll.options]
        )
        option = self._rng.choices(range(len(poll.options)), leaning)[0]
        member = self._rng.choice(await self._crowd())
        await self._store.polls.vote(poll.id, member.id, option)

    async def _crowd(self) -> list[Viewer]:
        if not self._members:
            for name in NAMES:
                viewer, _ = await self._store.viewers.create(name)
                self._members.append(viewer)
        return self._members

    def _line(self, agents: list[Agent], events: list[Event]) -> str:
        names = {agent.id: agent.name for agent in agents}
        latest = next((e for e in reversed(events) if e.kind in REACTIONS), None)
        if latest is not None and self._rng.random() < 0.4:
            actor = names.get(latest.actor_id or -1, "")
            target = names.get(latest.target_id or -1, actor)
            return self._rng.choice(REACTIONS[latest.kind]).format(a=actor, b=target)
        if len(names) >= 2 and self._rng.random() < 0.7:
            a, b = self._rng.sample(list(names.values()), 2)
            return self._rng.choice(ABOUT).format(a=a, b=b)
        return self._rng.choice(ANYTHING)
