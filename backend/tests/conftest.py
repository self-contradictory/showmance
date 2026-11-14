from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic_ai.messages import ModelResponse, ToolCallPart
from pydantic_ai.models.function import AgentInfo, FunctionModel

from api.app import create_app
from api.deps import get_services
from api.runners import Runners
from api.services import Services
from data import Store, connect
from domain import (
    Action,
    Agent,
    AgentContext,
    Audio,
    DirectorContext,
    Event,
    Location,
    Memory,
    NewAgent,
    NewLocation,
    NewWorld,
    PollFormat,
    Proposal,
    Reaction,
    Rejected,
    Relationship,
    Scene,
    SceneContext,
    Speech,
    Twist,
    TwistPlan,
    Wait,
    World,
)
from engine import Engine
from engine.casts import AgentsCast, WriterCast
from engine.state import WorldState
from memory import SqlMemoryStore
from voice import AudioCache, Narrator


class ScriptedDecider:
    def __init__(self, script: dict[str, Action | Exception]) -> None:
        self._script = script
        self.contexts: dict[str, AgentContext] = {}

    async def decide(self, context: AgentContext) -> Action:
        self.contexts[context.agent.name] = context
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


class ScriptedDirector:
    def __init__(
        self,
        plans: dict[str, TwistPlan | Rejected | Exception],
        proposal: Proposal | None,
    ) -> None:
        self._plans = plans
        self._proposal = proposal
        self.formats: list[PollFormat] = []
        self.contexts: list[DirectorContext] = []

    async def propose(
        self, context: DirectorContext, poll_format: PollFormat
    ) -> Proposal:
        self.formats.append(poll_format)
        if self._proposal is None:
            raise LookupError("no proposal scripted")
        return self._proposal

    async def stage(
        self, twist: Twist, context: DirectorContext
    ) -> TwistPlan | Rejected:
        self.contexts.append(context)
        plan = self._plans.get(twist.text, Rejected(reason="unscripted"))
        if isinstance(plan, Exception):
            raise plan
        return plan


class ScriptedWriter:
    def __init__(self, scenes: list[Scene | Exception]) -> None:
        self._scenes = list(scenes)
        self.contexts: list[SceneContext] = []

    async def write(self, context: SceneContext) -> Scene:
        self.contexts.append(context)
        scene = self._scenes.pop(0) if self._scenes else Scene(lines=[])
        if isinstance(scene, Exception):
            raise scene
        return scene


class FakeVoice:
    name = "fake"
    media_type = "audio/wav"

    def __init__(self) -> None:
        self.spoken: list[Speech] = []

    async def voices(self) -> list[str]:
        return ["v1", "v2", "v3"]

    async def speak(self, speech: Speech) -> Audio:
        self.spoken.append(speech)
        content = f"{speech.voice}|{speech.text}|{speech.emotion}".encode()
        return Audio(content=content, media_type=self.media_type)


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
    world = await store.worlds.create(NewWorld(name="Villa", setting="A villa in Bali"))
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
    def build(script=None, reactions=None, plans=None, proposal=None):
        decider = ScriptedDecider(script or {})
        appraiser = RecordingAppraiser(reactions or {})
        director = ScriptedDirector(plans or {}, proposal)
        cast = AgentsCast(memory, decider, appraiser)
        return SimpleNamespace(
            engine=Engine(store, memory, director, cast),
            decider=decider,
            appraiser=appraiser,
            director=director,
        )

    return build


@pytest.fixture
def writer_sim(store, memory):
    def build(scenes=(), plans=None, writer=None):
        writer = writer or ScriptedWriter(list(scenes))
        director = ScriptedDirector(plans or {}, None)
        return SimpleNamespace(
            engine=Engine(store, memory, director, WriterCast(store, writer)),
            writer=writer,
        )

    return build


@pytest.fixture
def context():
    pool = Location(id=1, world_id=1, name="pool")
    kitchen = Location(id=2, world_id=1, name="kitchen")
    return AgentContext(
        world=World(id=1, name="Villa", setting="A villa in Bali", tick=3),
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
def director_context(context):
    return DirectorContext(
        world=context.world,
        agents=[context.agent, *context.others],
        locations=context.locations,
        relationships=context.relationships,
        events=[Event(id=1, world_id=1, tick=2, kind="hug", actor_id=2, target_id=1)],
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


@pytest.fixture
def client(store, narrator):
    def build(engine):
        app = create_app()
        services = Services(
            store=store, engine=engine, runners=Runners(engine), narrator=narrator
        )
        app.dependency_overrides[get_services] = lambda: services
        return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")

    return build


@pytest.fixture
def twist():
    return Twist(
        id=1,
        world_id=1,
        text="tell Mia about the kiss",
        source="donation",
        status="pending",
        outcome=None,
        tick=None,
    )


@pytest.fixture
def fake_voice():
    return FakeVoice()


@pytest.fixture
def narrator(store, fake_voice, tmp_path):
    return Narrator(store, fake_voice, AudioCache(tmp_path / "audio"))
