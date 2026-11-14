from config import settings


async def join(http, name):
    token = (await http.post("/viewers", json={"name": name})).json()["token"]
    return {"Authorization": f"Bearer {token}"}


async def test_chat_is_shared_with_everyone(villa, sim, client):
    chat = f"/worlds/{villa.world.id}/chat"
    async with client(sim().engine) as http:
        anonymous = await http.post(chat, json={"text": "hi"})
        ann = await join(http, "Ann")
        bob = await join(http, "Bob")
        first = await http.post(chat, json={"text": "go Mia!"}, headers=ann)
        await http.post(chat, json={"text": "Jake is lying"}, headers=bob)
        too_long = await http.post(
            chat, json={"text": "x" * (settings.chat_max_length + 1)}, headers=ann
        )
        history = (await http.get(chat)).json()

    assert (anonymous.status_code, first.status_code, too_long.status_code) == (
        401,
        201,
        422,
    )
    assert [(m["name"], m["text"]) for m in history] == [
        ("Ann", "go Mia!"),
        ("Bob", "Jake is lying"),
    ]


async def test_world_shows_day_and_viewers(villa, sim, client):
    async with client(sim().engine) as http:
        view = (await http.get(f"/worlds/{villa.world.id}")).json()
        [summary] = (await http.get("/worlds")).json()

    assert (view["world"]["day"], view["viewers"]) == (1, 0)
    assert (summary["world"]["day"], summary["viewers"]) == (1, 0)
