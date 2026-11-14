from pydantic_ai import Agent, ToolOutput
from pydantic_ai.models import Model

from ai.base import Director
from ai.prompts import DIRECTOR_INSTRUCTIONS, PROPOSE_INSTRUCTIONS
from ai.render import render_director, render_proposal
from config import LLM_MODEL
from domain import DirectorContext, PollFormat, Proposal, Rejected, Twist, TwistPlan


class LlmDirector(Director):
    def __init__(self, model: Model | str | None = LLM_MODEL) -> None:
        self._proposer = Agent(
            model, instructions=PROPOSE_INSTRUCTIONS, output_type=Proposal
        )
        self._stager: Agent[None, TwistPlan | Rejected] = Agent(
            model,
            instructions=DIRECTOR_INSTRUCTIONS,
            output_type=[
                ToolOutput(TwistPlan, name="stage"),
                ToolOutput(Rejected, name="reject"),
            ],
        )

    async def propose(
        self, context: DirectorContext, poll_format: PollFormat
    ) -> Proposal:
        result = await self._proposer.run(render_proposal(context, poll_format))
        return result.output

    async def stage(
        self, twist: Twist, context: DirectorContext
    ) -> TwistPlan | Rejected:
        result = await self._stager.run(render_director(context, twist))
        return result.output
