from pydantic_ai import Agent
from pydantic_ai.models import Model

from ai.base import Writer
from ai.prompts import WRITE_INSTRUCTIONS
from ai.render import render_scene
from domain import Scene, SceneContext


class LlmWriter(Writer):
    def __init__(self, model: Model | str | None) -> None:
        self._agent = Agent(model, instructions=WRITE_INSTRUCTIONS, output_type=Scene)

    async def write(self, context: SceneContext) -> Scene:
        result = await self._agent.run(render_scene(context))
        return result.output
