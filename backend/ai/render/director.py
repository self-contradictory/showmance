from ai.prompts import POLL_FORMAT_REQUESTS, TWIST_HEADERS
from ai.render.villa import poll_section, recent, villa_sections
from domain import DirectorContext, PollFormat, Twist


def render_director(context: DirectorContext, twist: Twist) -> str:
    sections = [*villa_sections(context), recent(context)]
    if context.poll is not None:
        sections.append(poll_section(context.poll))
    sections.append(f"{TWIST_HEADERS[twist.source]}:\n<twist>\n{twist.text}\n</twist>")
    return "\n\n".join(sections)


def render_proposal(context: DirectorContext, poll_format: PollFormat) -> str:
    return "\n\n".join(
        [*villa_sections(context), recent(context), POLL_FORMAT_REQUESTS[poll_format]]
    )
