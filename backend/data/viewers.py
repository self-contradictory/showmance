import hashlib
import secrets

from sqlalchemy import select

from data.db import Repository
from data.errors import NotFound
from data.tables import ViewerRow
from domain import Viewer


class ViewerRepository(Repository):
    async def create(self, name: str) -> tuple[Viewer, str]:
        token = secrets.token_urlsafe(32)
        row = ViewerRow(name=name, token_hash=_hash(token), coins=0)
        async with self._session.begin() as s:
            s.add(row)
        return Viewer.model_validate(row), token

    async def get(self, viewer_id: int) -> Viewer:
        async with self._session() as s:
            row = await s.get(ViewerRow, viewer_id)
        if row is None:
            raise NotFound(f"viewer {viewer_id}")
        return Viewer.model_validate(row)

    async def by_token(self, token: str) -> Viewer | None:
        async with self._session() as s:
            row = await s.scalar(
                select(ViewerRow).where(ViewerRow.token_hash == _hash(token))
            )
        return None if row is None else Viewer.model_validate(row)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
