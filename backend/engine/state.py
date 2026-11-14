from dataclasses import dataclass

from data import Store
from domain import Agent, Location, Relationship, World


@dataclass
class WorldState:
    world: World
    agents: list[Agent]
    locations: list[Location]
    relationships: list[Relationship]

    def agent(self, agent_id: int) -> Agent:
        return next(a for a in self.agents if a.id == agent_id)

    def location(self, location_id: int) -> Location:
        return next(loc for loc in self.locations if loc.id == location_id)

    def at(self, location_id: int) -> list[Agent]:
        return [a for a in self.agents if a.location_id == location_id]

    def has_agent(self, agent_id: int) -> bool:
        return any(a.id == agent_id for a in self.agents)

    def has_location(self, location_id: int) -> bool:
        return any(loc.id == location_id for loc in self.locations)

    def move(self, agent_id: int, location_id: int) -> None:
        self.agents = [
            a.model_copy(update={"location_id": location_id}) if a.id == agent_id else a
            for a in self.agents
        ]


async def load_state(store: Store, world_id: int) -> WorldState:
    return WorldState(
        world=await store.worlds.get(world_id),
        agents=await store.agents.get_all(world_id),
        locations=await store.locations.get_all(world_id),
        relationships=await store.relationships.get_all(world_id),
    )
