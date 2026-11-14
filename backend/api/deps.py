from typing import Annotated

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api.services import Services
from data import NotFound
from domain import Viewer, World
from payments import Payments

bearer = HTTPBearer(auto_error=False)


def get_services(request: Request) -> Services:
    return request.app.state.services


ServicesDep = Annotated[Services, Depends(get_services)]


async def get_world(world_id: int, services: ServicesDep) -> World:
    try:
        return await services.store.worlds.get(world_id)
    except NotFound:
        raise HTTPException(status_code=404, detail="world not found") from None


WorldDep = Annotated[World, Depends(get_world)]


async def get_viewer(
    services: ServicesDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> Viewer:
    viewer = None
    if credentials is not None:
        viewer = await services.store.viewers.by_token(credentials.credentials)
    if viewer is None:
        raise HTTPException(status_code=401, detail="viewer token required")
    return viewer


ViewerDep = Annotated[Viewer, Depends(get_viewer)]


def get_payments(services: ServicesDep) -> Payments:
    if services.payments is None:
        raise HTTPException(status_code=503, detail="payments are not set up")
    return services.payments


PaymentsDep = Annotated[Payments, Depends(get_payments)]
