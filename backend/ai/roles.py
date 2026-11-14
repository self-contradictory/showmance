from dataclasses import dataclass

from pydantic_ai.models import Model

from ai.appraise import LlmAppraiser
from ai.base import Appraiser, Decider, Director
from ai.decide import LlmDecider
from ai.direct import LlmDirector
from config import settings


@dataclass
class Roles:
    decider: Decider
    appraiser: Appraiser
    director: Director


def llm_roles(model: Model | str | None = settings.llm_model) -> Roles:
    return Roles(
        decider=LlmDecider(model),
        appraiser=LlmAppraiser(model),
        director=LlmDirector(model),
    )
