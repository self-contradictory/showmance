from fastapi import APIRouter, HTTPException

from api.deps import ServicesDep, ViewerDep, WorldDep
from api.schemas import TwistRequest
from config import TWIST_PRICE
from data import NotFound
from domain import NewTwist, Twist

router = APIRouter()


@router.post("/worlds/{world_id}/twists", status_code=202)
async def send_twist(
    body: TwistRequest, world: WorldDep, viewer: ViewerDep, services: ServicesDep
) -> Twist:
    twist = await services.store.wallets.buy_twist(
        NewTwist(
            world_id=world.id,
            text=body.text,
            source="donation",
            viewer_id=viewer.id,
            price=TWIST_PRICE,
        )
    )
    if twist is None:
        raise HTTPException(status_code=402, detail="not enough coins")
    return twist


@router.get("/worlds/{world_id}/twists/{twist_id}")
async def get_twist(twist_id: int, world: WorldDep, services: ServicesDep) -> Twist:
    try:
        twist = await services.store.twists.get(twist_id)
    except NotFound:
        twist = None
    if twist is None or twist.world_id != world.id:
        raise HTTPException(status_code=404, detail="twist not found")
    return twist
