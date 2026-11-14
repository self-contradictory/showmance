from ai.prompts import POLL_FORMAT_REQUESTS, TWIST_HEADERS
from ai.render.common import bullets, event_line
from domain import DirectorContext, Poll, PollFormat, Twist


def render_director(context: DirectorContext, twist: Twist) -> str:
    sections = _villa(context)
    if context.poll is not None:
        sections.append(_poll(context.poll))
    sections.append(f"{TWIST_HEADERS[twist.source]}:\n<twist>\n{twist.text}\n</twist>")
    return "\n\n".join(sections)


def render_proposal(context: DirectorContext, poll_format: PollFormat) -> str:
    return "\n\n".join([*_villa(context), POLL_FORMAT_REQUESTS[poll_format]])


def _villa(context: DirectorContext) -> list[str]:
    return [
        f"Setting: {context.world.setting}\nTick: {context.world.tick}",
        _places(context),
        _people(context),
        _feelings(context),
        _recent(context),
    ]


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


def _poll(poll: Poll) -> str:
    lines = (f"{option.label}: {option.twist}" for option in poll.options)
    return f"Viewers are voting on: {poll.question}\n{bullets(lines, '')}"


def _names(context: DirectorContext) -> dict[int, str]:
    return {a.id: a.name for a in context.agents}
