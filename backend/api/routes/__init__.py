from api.routes import (
    audio,
    chat,
    control,
    events,
    polls,
    purchases,
    twists,
    viewers,
    worlds,
)

ROUTERS = [
    worlds.router,
    events.router,
    control.router,
    twists.router,
    polls.router,
    viewers.router,
    chat.router,
    audio.router,
    purchases.router,
]
