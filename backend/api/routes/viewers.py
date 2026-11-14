from fastapi import APIRouter

from api.deps import ServicesDep, ViewerDep
from api.schemas import ViewerRequest, ViewerSession
from config import STARTER_COINS
from domain import Viewer

router = APIRouter()


@router.post("/viewers", status_code=201)
async def join(body: ViewerRequest, services: ServicesDep) -> ViewerSession:
    store = services.store
    viewer, token = await store.viewers.create(body.name)
    await store.wallets.grant(viewer.id, STARTER_COINS, "starter")
    return ViewerSession(viewer=await store.viewers.get(viewer.id), token=token)


@router.get("/viewers/me")
async def me(viewer: ViewerDep) -> Viewer:
    return viewer
