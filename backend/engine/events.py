from domain import Action, Agent, NewEvent, action_kind
from engine.rules import witnesses
from engine.state import WorldState


def to_event(action: Action, actor: Agent, state: WorldState) -> NewEvent:
    fields = action.model_dump()
    target_id = fields.pop("target_id", None)
    text = fields.pop("text", None)
    return NewEvent(
        world_id=state.world.id,
        tick=state.world.tick,
        kind=action_kind(type(action)),
        actor_id=actor.id,
        target_id=target_id,
        location_id=actor.location_id,
        text=text,
        data=fields,
        witness_ids=witnesses(action, actor, state),
    )
