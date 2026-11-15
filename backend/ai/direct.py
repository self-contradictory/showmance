from pydantic_ai import Agent, ToolOutput
from pydantic_ai.models import Model

from ai.base import Director
from ai.prompts import (
    DIRECTOR_INSTRUCTIONS,
    PROPOSE_INSTRUCTIONS,
    VOTE_CHECK_INSTRUCTIONS,
)
from ai.render import render_director, render_proposal, render_vote_check
from domain import (
    DirectorContext,
    Poll,
    PollFormat,
    Proposal,
    Rejected,
    Twist,
    TwistPlan,
    VoteCheck,
)

STAGE = ToolOutput(TwistPlan, name="stage")
REJECT = ToolOutput(Rejected, name="reject")


class LlmDirector(Director):
    def __init__(self, model: Model | str | None) -> None:
        self._proposer = Agent(
            model, instructions=PROPOSE_INSTRUCTIONS, output_type=Proposal
        )
        self._stager: Agent[None, TwistPlan | Rejected] = Agent(
            model,
            instructions=DIRECTOR_INSTRUCTIONS,
            output_type=[STAGE, REJECT],
        )
        self._vote_checker = Agent(
            model, instructions=VOTE_CHECK_INSTRUCTIONS, output_type=VoteCheck
        )

    async def propose(
        self, context: DirectorContext, poll_format: PollFormat
    ) -> Proposal:
        result = await self._proposer.run(render_proposal(context, poll_format))
        return result.output

    async def stage(
        self, twist: Twist, context: DirectorContext
    ) -> TwistPlan | Rejected:
        prompt = render_director(context, twist)
        if twist.source == "vote":
            return (await self._stager.run(prompt, output_type=STAGE)).output
        return (await self._stager.run(prompt)).output

    async def decides_vote(self, twist: Twist, poll: Poll) -> bool:
        result = await self._vote_checker.run(render_vote_check(twist, poll))
        return result.output.decides_vote
