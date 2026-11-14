from sqlalchemy import select

from config import settings
from data.tables import ViewerRow


async def test_token_is_stored_only_as_a_hash(store, db):
    viewer, token = await store.viewers.create("Ann")

    async with db.connect() as conn:
        stored = await conn.scalar(
            select(ViewerRow.token_hash).where(ViewerRow.id == viewer.id)
        )

    assert stored != token
    assert (await store.viewers.by_token(token)) == viewer
    assert await store.viewers.by_token("wrong") is None


async def test_joining_gives_a_token_and_starter_coins(sim, client):
    async with client(sim().engine) as http:
        joined = await http.post("/viewers", json={"name": "Ann"})
        token = joined.json()["token"]
        me = await http.get("/viewers/me", headers={"Authorization": f"Bearer {token}"})

    assert joined.status_code == 201
    assert me.json() == {
        "id": joined.json()["viewer"]["id"],
        "name": "Ann",
        "coins": settings.starter_coins,
    }


async def test_me_needs_a_valid_token(sim, client):
    async with client(sim().engine) as http:
        missing = await http.get("/viewers/me")
        wrong = await http.get("/viewers/me", headers={"Authorization": "Bearer nope"})

    assert (missing.status_code, wrong.status_code) == (401, 401)
