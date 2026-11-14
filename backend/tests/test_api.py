from domain import Hug

VILLA = {
    "setting": "A villa in Bali",
    "locations": [{"name": "pool"}, {"name": "kitchen"}],
    "agents": [
        {"name": "Mia", "persona": "Bold.", "location": "pool"},
        {"name": "Jake", "persona": "Charming.", "location": "kitchen"},
    ],
}


async def test_create_world_and_read_it_back(sim, client):
    engine, _ = sim({})
    async with client(engine) as http:
        created = await http.post("/worlds", json=VILLA)
        view = (await http.get(f"/worlds/{created.json()['id']}")).json()

    assert created.status_code == 201
    places = {loc["id"]: loc["name"] for loc in view["locations"]}
    agents = {a["name"]: places[a["location_id"]] for a in view["agents"]}
    assert agents == {"Mia": "pool", "Jake": "kitchen"}
    assert view["running"] is False


async def test_agent_in_unknown_location_is_rejected(sim, client):
    lost = {**VILLA, "agents": [{"name": "Mia", "persona": "", "location": "roof"}]}
    engine, _ = sim({})
    async with client(engine) as http:
        response = await http.post("/worlds", json=lost)

    assert response.status_code == 422


async def test_unknown_world_is_not_found(sim, client):
    engine, _ = sim({})
    async with client(engine) as http:
        response = await http.get("/worlds/999")

    assert response.status_code == 404


async def test_step_returns_events_and_lists_them(villa, sim, client):
    engine, _ = sim({"Jake": Hug(target_id=villa.mia.id)})
    async with client(engine) as http:
        step = (await http.post(f"/worlds/{villa.world.id}/step")).json()
        listed = (await http.get(f"/worlds/{villa.world.id}/events")).json()
        newer = await http.get(
            f"/worlds/{villa.world.id}/events", params={"after_id": step[0]["id"]}
        )

    assert [event["kind"] for event in step] == ["hug"]
    assert listed == step
    assert newer.json() == []


async def test_twist_reaches_its_witnesses(villa, sim, client):
    engine, appraiser = sim({})
    twist = {
        "kind": "secret",
        "text": "Jake kissed Sara",
        "target_id": villa.mia.id,
        "witness_ids": [villa.mia.id],
    }
    async with client(engine) as http:
        response = await http.post(f"/worlds/{villa.world.id}/twists", json=twist)

    assert response.status_code == 201
    assert response.json()["kind"] == "secret"
    assert appraiser.seen == {"Mia": ["secret"]}


async def test_start_and_stop_the_show(villa, sim, client):
    engine, _ = sim({})
    world = f"/worlds/{villa.world.id}"
    async with client(engine) as http:
        started = await http.post(f"{world}/start")
        running = (await http.get(world)).json()["running"]
        stopped = await http.post(f"{world}/stop")
        after = (await http.get(world)).json()["running"]

    assert (started.status_code, running) == (204, True)
    assert (stopped.status_code, after) == (204, False)
