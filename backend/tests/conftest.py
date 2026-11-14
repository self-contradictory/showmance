from types import SimpleNamespace

import pytest
from pydantic_ai.messages import ModelResponse, ToolCallPart
from pydantic_ai.models.function import AgentInfo, FunctionModel

from data import Store, connect
from domain import (
    Agent,
    AgentContext,
    Location,
    Memory,
    NewAgent,
    NewLocation,
    Relationship,
    World,
)
from memory import SqlMemoryStore


@pytest.fixture
async def engine(tmp_path):
    engine = await connect(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    yield engine
    await engine.dispose()


@pytest.fixture
def store(engine):
    return Store(engine)


@pytest.fixture
def memory(engine):
    return SqlMemoryStore(engine)


@pytest.fixture
async def villa(store):
    world = await store.worlds.create("A villa in Bali")
    pool = await store.locations.add(NewLocation(world_id=world.id, name="pool"))
    kitchen = await store.locations.add(NewLocation(world_id=world.id, name="kitchen"))

    async def agent(name, location):
        return await store.agents.add(
            NewAgent(world_id=world.id, name=name, persona="", location_id=location.id)
        )

    return SimpleNamespace(
        world=world,
        pool=pool,
        kitchen=kitchen,
        mia=await agent("Mia", pool),
        jake=await agent("Jake", pool),
        sara=await agent("Sara", kitchen),
    )


@pytest.fixture
def context():
    pool = Location(id=1, world_id=1, name="pool")
    kitchen = Location(id=2, world_id=1, name="kitchen")
    return AgentContext(
        world=World(id=1, setting="A villa in Bali", tick=3),
        agent=Agent(
            id=1, world_id=1, name="Mia", persona="Bold and jealous.", location_id=1
        ),
        others=[
            Agent(id=2, world_id=1, name="Jake", persona="", location_id=1),
            Agent(id=3, world_id=1, name="Sara", persona="", location_id=2),
        ],
        locations=[pool, kitchen],
        relationships=[
            Relationship(from_id=1, to_id=2, affection=70, trust=40, note="flirty")
        ],
        memories=[Memory(id=1, agent_id=1, tick=2, text="Jake hugged me at the pool")],
    )


@pytest.fixture
def fake_model():
    def build(args, tool_name=None):
        seen = {}

        def respond(messages, info: AgentInfo) -> ModelResponse:
            seen["tools"] = {tool.name for tool in info.output_tools}
            seen["prompt"] = messages[-1].parts[-1].content
            name = tool_name or info.output_tools[0].name
            return ModelResponse(parts=[ToolCallPart(name, args)])

        return FunctionModel(respond), seen

    return build
