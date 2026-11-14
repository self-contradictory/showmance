from api.routes import control, events, twists, worlds

ROUTERS = [worlds.router, events.router, control.router, twists.router]
