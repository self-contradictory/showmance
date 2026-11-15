from dataclasses import dataclass

from pydantic_ai.models import Model

from ai.appraise import LlmAppraiser
from ai.base import Appraiser, Decider, Director, Writer
from ai.decide import LlmDecider
from ai.direct import LlmDirector
from ai.write import LlmWriter


@dataclass
class Roles:
    decider: Decider
    appraiser: Appraiser
    director: Director
    writer: Writer


def llm_roles(model: Model | str | None) -> Roles:
    return Roles(
        decider=LlmDecider(model),
        appraiser=LlmAppraiser(model),
        director=LlmDirector(model),
        writer=LlmWriter(model),
    )
