from engine import Engine, Runner


class Runners:
    def __init__(self, engine: Engine) -> None:
        self._engine = engine
        self._runners: dict[int, Runner] = {}

    def running(self, world_id: int) -> bool:
        runner = self._runners.get(world_id)
        return runner is not None and runner.running

    def start(self, world_id: int) -> None:
        if world_id not in self._runners:
            self._runners[world_id] = Runner(self._engine, world_id)
        self._runners[world_id].start()

    async def stop(self, world_id: int) -> None:
        runner = self._runners.get(world_id)
        if runner is not None:
            await runner.stop()

    async def stop_all(self) -> None:
        for runner in self._runners.values():
            await runner.stop()
