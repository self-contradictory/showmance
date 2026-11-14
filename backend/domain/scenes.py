from typing import Literal, get_args

from pydantic import Field, ValidationError

from config import settings
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
    text: str | None = None
    emotion: str | None = None
    target_id: int | None = None
    destination_id: int | None = None
    feelings: list[ScriptedFeeling] = Field(default_factory=list)

    def action(self) -> Action | None:
        fields = {
            "emotion": settings.default_mood,
            **self.model_dump(exclude_none=True),
        }
        try:
            return ACTIONS[self.kind].model_validate(fields)
        except ValidationError:
            return None


class Scene(Model):
    lines: list[Line]
