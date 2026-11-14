from sqlalchemy import func, select

from data.db import Repository
from data.tables import PollRow, VoteRow
from domain import NewPoll, Poll


class PollRepository(Repository):
    async def open(self, poll: NewPoll) -> Poll:
        row = PollRow(**poll.model_dump(), status="open", winner=None)
        async with self._session.begin() as s:
            s.add(row)
        return Poll.model_validate(row)

    async def current(self, world_id: int) -> Poll | None:
        async with self._session() as s:
            row = await s.scalar(
                select(PollRow)
                .where(PollRow.world_id == world_id, PollRow.status == "open")
                .order_by(PollRow.id.desc())
            )
        return None if row is None else Poll.model_validate(row)

    async def close(self, poll_id: int, winner: int) -> None:
        async with self._session.begin() as s:
            row = await s.get_one(PollRow, poll_id)
            row.status = "closed"
            row.winner = winner

    async def cancel(self, poll_id: int) -> None:
        async with self._session.begin() as s:
            (await s.get_one(PollRow, poll_id)).status = "closed"

    async def vote(self, poll_id: int, viewer_id: int, option: int) -> None:
        async with self._session.begin() as s:
            row = await s.get(VoteRow, (poll_id, viewer_id))
            if row is None:
                s.add(VoteRow(poll_id=poll_id, viewer_id=viewer_id, option=option))
            else:
                row.option = option

    async def tally(self, poll: Poll) -> list[int]:
        async with self._session() as s:
            rows = await s.execute(
                select(VoteRow.option, func.count())
                .where(VoteRow.poll_id == poll.id)
                .group_by(VoteRow.option)
            )
            counts = {option: count for option, count in rows}
        return [counts.get(index, 0) for index in range(len(poll.options))]
