from typing import get_args

from pydantic_ai import Agent, ToolOutput
from pydantic_ai.models import Model

from ai.base import Decider
from ai.prompts import DECIDE_INSTRUCTIONS
from ai.render import render_context
from domain import Action, AgentContext, action_kind


class LlmDecider(Decider):
    def __init__(self, model: Model | str | None) -> None:
        self._agent: Agent[None, Action] = Agent(
            model,
            instructions=DECIDE_INSTRUCTIONS,
            output_type=[
                ToolOutput(action, name=action_kind(action))
                for action in get_args(Action)
            ],
        )

    async def decide(self, context: AgentContext) -> Action:
        result = await self._agent.run(render_context(context))
        return result.output
