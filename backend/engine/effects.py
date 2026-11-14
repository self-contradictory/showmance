from data import Store
from domain import Action, Agent, Move
from engine.state import WorldState


class Effects:
    def __init__(self, store: Store) -> None:
        self._store = store

    async def apply(self, action: Action, actor: Agent, state: WorldState) -> None:
        match action:
            case Move(destination_id=destination_id):
                await self._store.agents.move(actor.id, destination_id)
                state.move(actor.id, destination_id)
