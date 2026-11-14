from typing import Annotated

from fastapi import Depends, HTTPException, Request

from api.services import Services
from data import NotFound
from domain import World


def get_services(request: Request) -> Services:
    return request.app.state.services


ServicesDep = Annotated[Services, Depends(get_services)]


async def get_world(world_id: int, services: ServicesDep) -> World:
    try:
        return await services.store.worlds.get(world_id)
    except NotFound:
        raise HTTPException(status_code=404, detail="world not found") from None


WorldDep = Annotated[World, Depends(get_world)]
