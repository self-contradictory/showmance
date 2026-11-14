from typing import Protocol

from domain import Action, AgentContext, Event, Reaction


class Decider(Protocol):
    async def decide(self, context: AgentContext) -> Action: ...


class Appraiser(Protocol):
    async def appraise(
        self, context: AgentContext, events: list[Event]
    ) -> Reaction: ...
