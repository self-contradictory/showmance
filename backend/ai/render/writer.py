from ai.render.common import bullets
from ai.render.villa import names, poll_section, recent, villa_sections
from domain import SceneContext


def render_scene(context: SceneContext) -> str:
    sections = [*villa_sections(context), recent(context, seen_by=True)]
    if context.poll is not None:
        sections.append(poll_section(context.poll))
    if context.directions:
        sections.append(_directions(context))
    return "\n\n".join(sections)


def _directions(context: SceneContext) -> str:
    who = names(context)
    lines = (
        f"{who.get(agent_id, 'someone')}: {direction}"
        for agent_id, directions in context.directions.items()
        for direction in directions
    )
    return f"The producers need this to happen now:\n{bullets(lines, '')}"
