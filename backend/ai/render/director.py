from ai.render.common import bullets, event_line
from domain import DirectorContext


def render_director(context: DirectorContext, twist: str) -> str:
    return "\n\n".join(
        [
            f"Setting: {context.world.setting}\nTick: {context.world.tick}",
            _places(context),
            _people(context),
            _feelings(context),
            _recent(context),
            f"The viewer's twist:\n<twist>\n{twist}\n</twist>",
        ]
    )


def _places(context: DirectorContext) -> str:
    lines = (
        f"{loc.name} (id {loc.id})"
        + (f": {loc.description}" if loc.description else "")
        for loc in context.locations
    )
    return f"Places:\n{bullets(lines, 'none')}"


def _people(context: DirectorContext) -> str:
    places = {loc.id: loc.name for loc in context.locations}
    lines = (
        f"{a.name} (id {a.id}), at {places[a.location_id]}, mood {a.mood}. {a.persona}"
        for a in context.agents
    )
    return f"People:\n{bullets(lines, 'nobody')}"


def _feelings(context: DirectorContext) -> str:
    names = _names(context)
    lines = (
        f"{names[r.from_id]} → {names[r.to_id]}: "
        f"affection {r.affection}, trust {r.trust}" + (f". {r.note}" if r.note else "")
        for r in context.relationships
    )
    return f"Feelings:\n{bullets(lines, 'none yet')}"


def _recent(context: DirectorContext) -> str:
    names = _names(context)
    lines = (f"[tick {e.tick}] {event_line(e, names)}" for e in context.events)
    return f"Recently:\n{bullets(lines, 'nothing yet')}"


def _names(context: DirectorContext) -> dict[int, str]:
    return {a.id: a.name for a in context.agents}
