from pydantic_ai import Agent
from pydantic_ai.models import Model

from ai.base import Appraiser
from ai.prompts import APPRAISE_INSTRUCTIONS
from ai.render import render_appraisal
from domain import AgentContext, Event, Reaction


class LlmAppraiser(Appraiser):
    def __init__(self, model: Model | str | None) -> None:
        self._agent = Agent(
            model, instructions=APPRAISE_INSTRUCTIONS, output_type=Reaction
        )

    async def appraise(self, context: AgentContext, events: list[Event]) -> Reaction:
        result = await self._agent.run(render_appraisal(context, events))
        return result.output
