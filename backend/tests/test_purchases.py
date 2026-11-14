from config import settings

SMALL = settings.coin_packs[0]


async def join(http, name="ana"):
    token = (await http.post("/viewers", json={"name": name})).json()["token"]
    return {"Authorization": f"Bearer {token}"}


async def buy(http, headers, pack_id=SMALL.id):
    return await http.post("/purchases", json={"pack_id": pack_id}, headers=headers)


async def confirm(http, headers, purchase_id):
    return await http.post(f"/purchases/{purchase_id}/confirm", headers=headers)


async def test_packs_are_listed(sim, client):
    async with client(sim().engine) as http:
        shop = (await http.get("/packs")).json()

    assert shop["currency"] == settings.currency
    assert [p["id"] for p in shop["packs"]] == [p.id for p in settings.coin_packs]


async def test_paid_pack_adds_its_coins_once(sim, client, payments):
    async with client(sim().engine) as http:
        me = await join(http)
        started = await buy(http, me)
        checkout = started.json()
        payments.paid_ids.add(checkout["id"])
        first = await confirm(http, me, checkout["id"])
        again = await confirm(http, me, checkout["id"])

    assert started.status_code == 201
    assert checkout["client_secret"] == f"{checkout['id']}_secret"
    assert first.json()["coins"] == settings.starter_coins + SMALL.coins
    assert again.json()["coins"] == settings.starter_coins + SMALL.coins


async def test_unpaid_purchase_adds_nothing(sim, client):
    async with client(sim().engine) as http:
        me = await join(http)
        checkout = (await buy(http, me)).json()
        response = await confirm(http, me, checkout["id"])
        coins = (await http.get("/viewers/me", headers=me)).json()["coins"]

    assert response.status_code == 409
    assert coins == settings.starter_coins


async def test_purchase_belongs_to_whoever_started_it(sim, client, payments):
    async with client(sim().engine) as http:
        ana = await join(http, "ana")
        ben = await join(http, "ben")
        checkout = (await buy(http, ana)).json()
        payments.paid_ids.add(checkout["id"])
        response = await confirm(http, ben, checkout["id"])

    assert response.status_code == 404


async def test_unknown_pack_is_rejected(sim, client, payments):
    async with client(sim().engine) as http:
        response = await buy(http, await join(http), "huge")

    assert response.status_code == 404
    assert payments.started == 0


async def test_buying_needs_payments_set_up(sim, client):
    async with client(sim().engine, payments=None) as http:
        response = await buy(http, await join(http))

    assert response.status_code == 503


async def test_payment_provider_errors_are_reported(sim, client, payments):
    payments.failing = True
    async with client(sim().engine) as http:
        response = await buy(http, await join(http))

    assert response.status_code == 502
