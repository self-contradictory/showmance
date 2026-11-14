from typing import Literal, get_args

from pydantic import Field, ValidationError

from domain.actions import Action, action_kind
from domain.base import Model
from domain.reactions import FeelingChange

LineKind = Literal["say", "hug", "kiss", "move", "confess"]

ACTIONS = {action_kind(action): action for action in get_args(Action)}


class ScriptedFeeling(FeelingChange):
    from_id: int


class Line(Model):
    actor_id: int
    kind: LineKind
    emotion: str
    text: str | None = None
    target_id: int | None = None
    destination_id: int | None = None
    feelings: list[ScriptedFeeling] = Field(default_factory=list)

    def action(self) -> Action | None:
        try:
            return ACTIONS[self.kind].model_validate(self.model_dump(exclude_none=True))
        except ValidationError:
            return None


class Scene(Model):
    lines: list[Line]
