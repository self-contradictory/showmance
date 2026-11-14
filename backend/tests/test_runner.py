import asyncio

from engine import Runner


async def test_runner_steps_until_stopped(store, villa, sim):
    runner = Runner(sim().engine, villa.world.id, interval=0)

    runner.start()
    async with asyncio.timeout(2):
        while (await store.worlds.get(villa.world.id)).tick < 3:
            await asyncio.sleep(0.01)
    await runner.stop()
    stopped_at = (await store.worlds.get(villa.world.id)).tick
    await asyncio.sleep(0.05)

    assert not runner.running
    assert (await store.worlds.get(villa.world.id)).tick == stopped_at
