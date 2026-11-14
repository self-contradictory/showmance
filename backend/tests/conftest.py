from types import SimpleNamespace

import pytest
from pydantic_ai.messages import ModelResponse, ToolCallPart
from pydantic_ai.models.function import AgentInfo, FunctionModel

from data import Store, connect
from domain import (
    Action,
    Agent,
    AgentContext,
    Event,
    Location,
    Memory,
    NewAgent,
    NewLocation,
    Reaction,
    Relationship,
    Wait,
    World,
)
from engine import Engine
from engine.state import WorldState
from memory import SqlMemoryStore


class ScriptedDecider:
    def __init__(self, script: dict[str, Action | Exception]) -> None:
        self._script = script

    async def decide(self, context: AgentContext) -> Action:
        choice = self._script.get(context.agent.name, Wait())
        if isinstance(choice, Exception):
            raise choice
        return choice


class RecordingAppraiser:
    def __init__(self, reactions: dict[str, Reaction]) -> None:
        self._reactions = reactions
        self.seen: dict[str, list[str]] = {}

    async def appraise(self, context: AgentContext, events: list[Event]) -> Reaction:
        self.seen[context.agent.name] = [event.kind for event in events]
        default = Reaction(mood="calm", memory="noted", changes=[])
        return self._reactions.get(context.agent.name, default)


@pytest.fixture
async def db(tmp_path):
    db = await connect(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    yield db
    await db.dispose()


@pytest.fixture
def store(db):
    return Store(db)


@pytest.fixture
def memory(db):
    return SqlMemoryStore(db)


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
def sim(store, memory):
    def build(script, reactions=None):
        appraiser = RecordingAppraiser(reactions or {})
        return Engine(store, memory, ScriptedDecider(script), appraiser), appraiser

    return build


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
def state(context):
    return WorldState(
        world=context.world,
        agents=[context.agent, *context.others],
        locations=context.locations,
        relationships=context.relationships,
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
