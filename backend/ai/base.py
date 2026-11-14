from typing import Protocol

from domain import (
    Action,
    AgentContext,
    DirectorContext,
    Event,
    Reaction,
    Rejected,
    TwistPlan,
)


class Decider(Protocol):
    async def decide(self, context: AgentContext) -> Action: ...


class Appraiser(Protocol):
    async def appraise(
        self, context: AgentContext, events: list[Event]
    ) -> Reaction: ...


class Director(Protocol):
    async def stage(
        self, twist: str, context: DirectorContext
    ) -> TwistPlan | Rejected: ...
