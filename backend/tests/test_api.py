from config import TWIST_MAX_LENGTH
from domain import Hug, Reveal, TwistPlan

VILLA = {
    "setting": "A villa in Bali",
    "locations": [{"name": "pool"}, {"name": "kitchen"}],
    "agents": [
        {"name": "Mia", "persona": "Bold.", "location": "pool"},
        {"name": "Jake", "persona": "Charming.", "location": "kitchen"},
    ],
}


async def test_create_world_and_read_it_back(sim, client):
    async with client(sim().engine) as http:
        created = await http.post("/worlds", json=VILLA)
        view = (await http.get(f"/worlds/{created.json()['id']}")).json()

    assert created.status_code == 201
    places = {loc["id"]: loc["name"] for loc in view["locations"]}
    agents = {a["name"]: places[a["location_id"]] for a in view["agents"]}
    assert agents == {"Mia": "pool", "Jake": "kitchen"}
    assert view["running"] is False


async def test_agent_in_unknown_location_is_rejected(sim, client):
    lost = {**VILLA, "agents": [{"name": "Mia", "persona": "", "location": "roof"}]}
    async with client(sim().engine) as http:
        response = await http.post("/worlds", json=lost)

    assert response.status_code == 422


async def test_unknown_world_is_not_found(sim, client):
    async with client(sim().engine) as http:
        response = await http.get("/worlds/999")

    assert response.status_code == 404


async def test_step_returns_events_and_lists_them(villa, sim, client):
    s = sim({"Jake": Hug(target_id=villa.mia.id)})
    async with client(s.engine) as http:
        step = (await http.post(f"/worlds/{villa.world.id}/step")).json()
        listed = (await http.get(f"/worlds/{villa.world.id}/events")).json()
        newer = await http.get(
            f"/worlds/{villa.world.id}/events", params={"after_id": step[0]["id"]}
        )

    assert [event["kind"] for event in step] == ["hug"]
    assert listed == step
    assert newer.json() == []


async def test_twist_waits_for_the_next_tick(villa, sim, client):
    plan = TwistPlan(
        summary="Mia finds out",
        reveals=[Reveal(text="Jake kissed Sara", to_ids=[villa.mia.id])],
    )
    s = sim(plans={"tell Mia about the kiss": plan})
    world = f"/worlds/{villa.world.id}"
    async with client(s.engine) as http:
        sent = await http.post(
            f"{world}/twists", json={"text": "tell Mia about the kiss"}
        )
        twist = f"{world}/twists/{sent.json()['id']}"
        before = (await http.get(twist)).json()
        await http.post(f"{world}/step")
        after = (await http.get(twist)).json()

    assert sent.status_code == 202
    assert before["status"] == "pending"
    assert (after["status"], after["outcome"]) == ("staged", "Mia finds out")


async def test_twist_text_must_fit(villa, sim, client):
    world = f"/worlds/{villa.world.id}"
    async with client(sim().engine) as http:
        empty = await http.post(f"{world}/twists", json={"text": ""})
        long = await http.post(
            f"{world}/twists", json={"text": "x" * (TWIST_MAX_LENGTH + 1)}
        )
        missing = await http.get(f"{world}/twists/999")

    assert (empty.status_code, long.status_code, missing.status_code) == (
        422,
        422,
        404,
    )


async def test_start_and_stop_the_show(villa, sim, client):
    world = f"/worlds/{villa.world.id}"
    async with client(sim().engine) as http:
        started = await http.post(f"{world}/start")
        running = (await http.get(world)).json()["running"]
        stopped = await http.post(f"{world}/stop")
        after = (await http.get(world)).json()["running"]

    assert (started.status_code, running) == (204, True)
    assert (stopped.status_code, after) == (204, False)
