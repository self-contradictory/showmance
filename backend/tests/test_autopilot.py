from types import SimpleNamespace

from api.autopilot import Autopilot
from api.presence import Presence
from config import settings
from domain import NewWorld


class Clock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


class FakeRunners:
    def __init__(self) -> None:
        self.on: set[int] = set()

    def running(self, world_id: int) -> bool:
        return world_id in self.on

    def start(self, world_id: int) -> None:
        self.on.add(world_id)

    async def stop(self, world_id: int) -> None:
        self.on.discard(world_id)


def build(store):
    clock = Clock()
    presence = Presence(clock)
    runners = FakeRunners()
    return SimpleNamespace(
        clock=clock,
        presence=presence,
        runners=runners,
        autopilot=Autopilot(store, runners, presence),
    )


async def test_nothing_runs_while_nobody_watches(store, villa):
    a = build(store)

    await a.autopilot.sync()

    assert a.runners.on == set()


async def test_world_runs_while_someone_watches_it(store, villa):
    other = await store.worlds.create(NewWorld(name="Chalet", setting=""))
    a = build(store)

    with a.presence.watching(villa.world.id):
        await a.autopilot.sync()

    assert a.runners.on == {villa.world.id}
    assert not a.runners.running(other.id)


async def test_world_stops_a_while_after_the_last_viewer_leaves(store, villa):
    a = build(store)
    with a.presence.watching(villa.world.id):
        await a.autopilot.sync()

    a.clock.now += settings.idle_grace - 1
    await a.autopilot.sync()
    still_running = a.runners.running(villa.world.id)
    a.clock.now += 2
    await a.autopilot.sync()

    assert (still_running, a.runners.running(villa.world.id)) == (True, False)


async def test_homepage_visit_runs_every_world_for_a_while(store, villa):
    other = await store.worlds.create(NewWorld(name="Chalet", setting=""))
    a = build(store)

    a.presence.visit_homepage()
    await a.autopilot.sync()
    running = set(a.runners.on)
    a.clock.now += settings.idle_grace
    await a.autopilot.sync()

    assert running == {villa.world.id, other.id}
    assert a.runners.on == set()
