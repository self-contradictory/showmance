from pydantic_ai import Agent, ToolOutput
from pydantic_ai.models import Model

from ai.base import Director
from ai.prompts import DIRECTOR_INSTRUCTIONS
from ai.render import render_director
from config import LLM_MODEL
from domain import DirectorContext, Rejected, TwistPlan


class LlmDirector(Director):
    def __init__(self, model: Model | str | None = LLM_MODEL) -> None:
        self._agent: Agent[None, TwistPlan | Rejected] = Agent(
            model,
            instructions=DIRECTOR_INSTRUCTIONS,
            output_type=[
                ToolOutput(TwistPlan, name="stage"),
                ToolOutput(Rejected, name="reject"),
            ],
        )

    async def stage(self, twist: str, context: DirectorContext) -> TwistPlan | Rejected:
        result = await self._agent.run(render_director(context, twist))
        return result.output
