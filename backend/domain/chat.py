from domain.base import Model


class NewChatMessage(Model):
    world_id: int
    viewer_id: int
    name: str
    text: str


class ChatMessage(NewChatMessage):
    id: int
