from api.routes import control, events, polls, twists, viewers, worlds

ROUTERS = [
    worlds.router,
    events.router,
    control.router,
    twists.router,
    polls.router,
    viewers.router,
]
