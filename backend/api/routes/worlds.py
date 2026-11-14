from fastapi import APIRouter

from api.deps import ServicesDep, WorldDep
from api.schemas import WorldSpec, WorldSummary, WorldView
from domain import NewAgent, NewLocation, NewWorld, World

router = APIRouter()


@router.get("/worlds")
async def list_worlds(services: ServicesDep) -> list[WorldSummary]:
    return [
        WorldSummary(
            world=world,
            running=services.runners.running(world.id),
            viewers=services.presence.count(world.id),
        )
        for world in await services.store.worlds.get_all()
    ]


@router.post("/worlds", status_code=201)
async def create_world(spec: WorldSpec, services: ServicesDep) -> World:
    store = services.store
    world = await store.worlds.create(
        NewWorld(
            name=spec.name,
            setting=spec.setting,
            thumbnail_url=spec.thumbnail_url,
            home=spec.home,
            figures=spec.figures,
        )
    )
    location_ids = {}
    for location in spec.locations:
        saved = await store.locations.add(
            NewLocation(
                world_id=world.id,
                name=location.name,
                description=location.description,
            )
        )
        location_ids[saved.name] = saved.id
    for agent in spec.agents:
        saved = await store.agents.add(
            NewAgent(
                world_id=world.id,
                name=agent.name,
                persona=agent.persona,
                gender=agent.gender,
                location_id=location_ids[agent.location],
            )
        )
        if agent.voice is not None:
            await store.voices.assign(saved.id, agent.voice)
    return world


@router.get("/worlds/{world_id}")
async def get_world(world: WorldDep, services: ServicesDep) -> WorldView:
    store = services.store
    return WorldView(
        world=world,
        locations=await store.locations.get_all(world.id),
        agents=await store.agents.get_all(world.id),
        relationships=await store.relationships.get_all(world.id),
        running=services.runners.running(world.id),
        viewers=services.presence.count(world.id),
    )
