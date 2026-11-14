from ai.render.common import bullets
from ai.render.villa import names, poll_section, recent, villa_sections
from domain import Beat, Line, SceneContext


def render_scene(context: SceneContext) -> str:
    sections = [*villa_sections(context), recent(context, seen_by=True)]
    if context.beat_rules:
        sections.append(f"How beats play:\n{bullets(context.beat_rules, '')}")
    if context.upcoming:
        sections.append(_upcoming(context))
    if context.poll is not None:
        sections.append(poll_section(context.poll))
    if context.directions:
        sections.append(_directions(context))
    return "\n\n".join(sections)


def _upcoming(context: SceneContext) -> str:
    who = names(context)
    places = {loc.id: loc.name for loc in context.locations}
    beats = (_beat(beat, who, places) for beat in context.upcoming)
    return f"Already written, playing next, one beat per line:\n{bullets(beats, '')}"


def _beat(beat: Beat, who: dict[int, str], places: dict[int, str]) -> str:
    return " + ".join(_line(line, who, places) for line in beat.lines)


def _line(line: Line, who: dict[int, str], places: dict[int, str]) -> str:
    text = f"{who.get(line.actor_id, 'someone')}: {line.kind}"
    if line.text:
        text += f' "{line.text}"'
    details = []
    if line.target_id is not None:
        details.append(f"to {who.get(line.target_id, 'someone')}")
    if line.destination_id is not None:
        details.append(f"to {places.get(line.destination_id, 'somewhere')}")
    details.append(f"emotion: {line.emotion}")
    return f"{text} ({', '.join(details)})"


def _directions(context: SceneContext) -> str:
    who = names(context)
    lines = (
        f"{who.get(agent_id, 'someone')}: {direction}"
        for agent_id, directions in context.directions.items()
        for direction in directions
    )
    return f"The producers need this to happen now:\n{bullets(lines, '')}"
