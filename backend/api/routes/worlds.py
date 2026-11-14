from fastapi import APIRouter

from api.deps import ServicesDep, WorldDep
from api.schemas import WorldSpec, WorldView
from domain import NewAgent, NewLocation, World

router = APIRouter()


@router.post("/worlds", status_code=201)
async def create_world(spec: WorldSpec, services: ServicesDep) -> World:
    store = services.store
    world = await store.worlds.create(spec.setting)
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
        await store.agents.add(
            NewAgent(
                world_id=world.id,
                name=agent.name,
                persona=agent.persona,
                location_id=location_ids[agent.location],
            )
        )
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
    )
