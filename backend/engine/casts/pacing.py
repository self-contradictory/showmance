from collections.abc import Sequence
from typing import Protocol

from ai.prompts import PARALLEL_BEATS, SEQUENTIAL_BEATS
from config import PacingKind
from domain import SPOKEN_KINDS, Line


class Pacing(Protocol):
    rules: Sequence[str]

    def joins(self, line: Line, beat: Sequence[Line]) -> bool: ...


class Parallel(Pacing):
    rules = PARALLEL_BEATS

    def joins(self, line: Line, beat: Sequence[Line]) -> bool:
        speaks = line.kind in SPOKEN_KINDS
        return all(
            other.actor_id != line.actor_id
            and not (speaks and other.kind in SPOKEN_KINDS)
            for other in beat
        )


class Sequential(Pacing):
    rules = SEQUENTIAL_BEATS

    def joins(self, line: Line, beat: Sequence[Line]) -> bool:
        return not beat


def build_pacing(kind: PacingKind) -> Pacing:
    match kind:
        case "parallel":
            return Parallel()
        case "sequential":
            return Sequential()
