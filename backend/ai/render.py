from collections.abc import Iterable

from domain import AgentContext, Event


def render_context(context: AgentContext) -> str:
    return "\n\n".join(
        [
            _world(context),
            _self(context),
            _surroundings(context),
            _feelings(context),
            _memories(context),
        ]
    )


def render_appraisal(context: AgentContext, events: list[Event]) -> str:
    names = _names(context)
    happened = _bullets((_event(event, names) for event in events), "nothing")
    return f"{render_context(context)}\n\nWhat just happened:\n{happened}"


def _world(context: AgentContext) -> str:
    return f"Setting: {context.world.setting}\nTick: {context.world.tick}"


def _self(context: AgentContext) -> str:
    me = context.agent
    return f"You are {me.name} (id {me.id}). {me.persona}\nMood: {me.mood}"


def _surroundings(context: AgentContext) -> str:
    me = context.agent
    here = next(loc for loc in context.locations if loc.id == me.location_id)
    people = [
        f"{a.name} (id {a.id})" for a in context.others if a.location_id == here.id
    ]
    places = [
        f"{loc.name} (id {loc.id})" for loc in context.locations if loc.id != here.id
    ]
    return (
        f"You are at: {here.name}\n"
        f"Here with you: {', '.join(people) or 'nobody'}\n"
        f"You can go to: {', '.join(places) or 'nowhere else'}"
    )


def _feelings(context: AgentContext) -> str:
    names = _names(context)
    lines = (
        f"{names[r.to_id]} (id {r.to_id}): affection {r.affection}, trust {r.trust}"
        + (f". {r.note}" if r.note else "")
        for r in context.relationships
    )
    return f"How you feel about others:\n{_bullets(lines, 'no strong feelings yet')}"


def _memories(context: AgentContext) -> str:
    lines = (f"[tick {m.tick}] {m.text}" for m in context.memories)
    return f"What you remember:\n{_bullets(lines, 'nothing yet')}"


def _event(event: Event, names: dict[int, str]) -> str:
    line = event.kind
    if event.actor_id is not None:
        line = f"{names.get(event.actor_id, 'someone')}: {line}"
    if event.text:
        line += f' "{event.text}"'
    details = (
        []
        if event.target_id is None
        else [f"to {names.get(event.target_id, 'someone')}"]
    )
    details += [f"{key}: {value}" for key, value in event.data.items()]
    if details:
        line += f" ({', '.join(details)})"
    return line


def _names(context: AgentContext) -> dict[int, str]:
    return {a.id: a.name for a in [context.agent, *context.others]}


def _bullets(lines: Iterable[str], empty: str) -> str:
    return "\n".join(f"- {line}" for line in lines) or f"- {empty}"
