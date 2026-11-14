from ai.render.common import bullets, event_line
from domain import DirectorContext, Event, Poll


def villa_sections(context: DirectorContext) -> list[str]:
    return [
        f"Setting: {context.world.setting}\nTick: {context.world.tick}",
        _places(context),
        _people(context),
        _feelings(context),
    ]


def recent(context: DirectorContext, seen_by: bool = False) -> str:
    who = names(context)
    lines = (
        f"[tick {e.tick}] {event_line(e, who)}" + (_seen(e, who) if seen_by else "")
        for e in context.events
    )
    return f"Recently:\n{bullets(lines, 'nothing yet')}"


def poll_section(poll: Poll) -> str:
    lines = (f"{option.label}: {option.twist}" for option in poll.options)
    return f"Viewers are voting on: {poll.question}\n{bullets(lines, '')}"


def names(context: DirectorContext) -> dict[int, str]:
    return {a.id: a.name for a in context.agents}


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
    who = names(context)
    lines = (
        f"{who[r.from_id]} → {who[r.to_id]}: "
        f"affection {r.affection}, trust {r.trust}" + (f". {r.note}" if r.note else "")
        for r in context.relationships
    )
    return f"Feelings:\n{bullets(lines, 'none yet')}"


def _seen(event: Event, who: dict[int, str]) -> str:
    if not event.witness_ids:
        return " [viewers only]"
    return f" [seen by: {', '.join(who.get(i, 'someone') for i in event.witness_ids)}]"
