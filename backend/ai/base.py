from typing import Protocol

from domain import (
    Action,
    AgentContext,
    DirectorContext,
    Event,
    PollFormat,
    Proposal,
    Reaction,
    Rejected,
    Twist,
    TwistPlan,
)


class Decider(Protocol):
    async def decide(self, context: AgentContext) -> Action: ...


class Appraiser(Protocol):
    async def appraise(
        self, context: AgentContext, events: list[Event]
    ) -> Reaction: ...


class Director(Protocol):
    async def propose(
        self, context: DirectorContext, poll_format: PollFormat
    ) -> Proposal: ...

    async def stage(
        self, twist: Twist, context: DirectorContext
    ) -> TwistPlan | Rejected: ...
