from ai.prompts import POLL_FORMAT_REQUESTS, TWIST_HEADERS
from ai.render.villa import poll_section, recent, villa_sections
from domain import DirectorContext, Poll, PollFormat, Twist


def render_director(context: DirectorContext, twist: Twist) -> str:
    return "\n\n".join(
        [
            *villa_sections(context),
            recent(context),
            _twist(TWIST_HEADERS[twist.source], twist),
        ]
    )


def render_proposal(context: DirectorContext, poll_format: PollFormat) -> str:
    return "\n\n".join(
        [*villa_sections(context), recent(context), POLL_FORMAT_REQUESTS[poll_format]]
    )


def render_vote_check(twist: Twist, poll: Poll) -> str:
    return f"{poll_section(poll)}\n\n{_twist('The paid twist', twist)}"


def _twist(header: str, twist: Twist) -> str:
    return f"{header}:\n<twist>\n{twist.text}\n</twist>"
