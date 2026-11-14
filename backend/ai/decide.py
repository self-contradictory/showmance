from typing import get_args

from pydantic_ai import Agent, ToolOutput
from pydantic_ai.models import Model

from ai.base import Decider
from ai.prompts import DECIDE_INSTRUCTIONS
from ai.render import render_context
from config import LLM_MODEL
from domain import Action, AgentContext


class LlmDecider(Decider):
    def __init__(self, model: Model | str | None = LLM_MODEL) -> None:
        self._agent: Agent[None, Action] = Agent(
            model,
            instructions=DECIDE_INSTRUCTIONS,
            output_type=[
                ToolOutput(action, name=action.__name__.lower())
                for action in get_args(Action)
            ],
        )

    async def decide(self, context: AgentContext) -> Action:
        result = await self._agent.run(render_context(context))
        return result.output
