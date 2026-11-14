from domain import Action, Agent, Confess, FeelingChange, Wait
from engine.state import WorldState

PRIVATE_ACTIONS = (Confess,)


def takes_effect(action: Action, actor: Agent, state: WorldState) -> bool:
    if isinstance(action, Wait):
        return False
    target_id = getattr(action, "target_id", None)
    if target_id is not None and not _is_here(target_id, actor, state):
        return False
    destination_id = getattr(action, "destination_id", None)
    return destination_id is None or _can_go(destination_id, actor, state)


def witnesses(action: Action, actor: Agent, state: WorldState) -> list[int]:
    if isinstance(action, PRIVATE_ACTIONS):
        return [actor.id]
    return [a.id for a in state.at(actor.location_id)]


def can_feel(change: FeelingChange, agent: Agent, state: WorldState) -> bool:
    return change.to_id != agent.id and state.has_agent(change.to_id)


def _is_here(target_id: int, actor: Agent, state: WorldState) -> bool:
    present = {a.id for a in state.at(actor.location_id)}
    return target_id != actor.id and target_id in present


def _can_go(destination_id: int, actor: Agent, state: WorldState) -> bool:
    return destination_id != actor.location_id and state.has_location(destination_id)
