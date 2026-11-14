from collections.abc import Iterable

from domain import Agent, Event


def render_memory(events: Iterable[Event], agents: Iterable[Agent]) -> str:
    names = {a.id: a.name for a in agents}
    return "; ".join(event_line(event, names) for event in events)


def bullets(lines: Iterable[str], empty: str) -> str:
    return "\n".join(f"- {line}" for line in lines) or f"- {empty}"


def event_line(event: Event, names: dict[int, str]) -> str:
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
