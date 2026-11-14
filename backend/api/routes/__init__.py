from api.routes import control, events, twists, viewers, worlds

ROUTERS = [
    worlds.router,
    events.router,
    control.router,
    twists.router,
    viewers.router,
]
