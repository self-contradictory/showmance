from fastapi import APIRouter

from api.deps import ServicesDep, ViewerDep, WorldDep
from api.schemas import ChatRequest
from config import settings
from domain import ChatMessage, NewChatMessage

router = APIRouter()


@router.get("/worlds/{world_id}/chat")
async def chat_history(world: WorldDep, services: ServicesDep) -> list[ChatMessage]:
    return await services.store.chat.recent(world.id, settings.chat_history)


@router.post("/worlds/{world_id}/chat", status_code=201)
async def send_chat(
    body: ChatRequest, world: WorldDep, viewer: ViewerDep, services: ServicesDep
) -> ChatMessage:
    return await services.store.chat.add(
        NewChatMessage(
            world_id=world.id, viewer_id=viewer.id, name=viewer.name, text=body.text
        )
    )
