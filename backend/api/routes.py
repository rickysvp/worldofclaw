"""
API 路由
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from server.core.database import get_db
from server.core import game
from server.world.map import get_location, get_all_locations, get_connected_locations


router = APIRouter()


# ==================== 请求模型 ====================

class CreateClawRequest(BaseModel):
    claw_id: str
    name: str


class MoveRequest(BaseModel):
    destination_id: str


class GatherRequest(BaseModel):
    pass


# ==================== 角色 API ====================

@router.post("/claws")
async def create_claw(req: CreateClawRequest, db: AsyncSession = Depends(get_db)):
    """创建角色"""
    claw = await game.create_claw(db, req.claw_id, req.name)
    return {"success": True, "claw": claw.to_dict()}


@router.get("/claws/{claw_id}")
async def get_claw_status(claw_id: str, db: AsyncSession = Depends(get_db)):
    """获取角色状态"""
    claw = await game.get_claw(db, claw_id)
    if not claw:
        return {"error": "Claw 不存在"}
    return {"claw": claw.to_dict()}


@router.post("/claws/{claw_id}/move")
async def move_claw(claw_id: str, req: MoveRequest, db: AsyncSession = Depends(get_db)):
    """移动"""
    result = await game.move_claw(db, claw_id, req.destination_id)
    return result


@router.post("/claws/{claw_id}/gather")
async def gather_resource(claw_id: str, db: AsyncSession = Depends(get_db)):
    """采集资源"""
    result = await game.gather_resource(db, claw_id)
    return result


# ==================== 世界 API ====================

@router.get("/world/locations")
async def list_locations():
    """列出所有地点"""
    locations = get_all_locations()
    return {"locations": [loc.model_dump() for loc in locations]}


@router.get("/world/locations/{location_id}")
async def get_location_info(location_id: str):
    """获取地点详情"""
    loc = get_location(location_id)
    if not loc:
        return {"error": "地点不存在"}
    
    connected = get_connected_locations(location_id)
    return {
        "location": loc.model_dump(),
        "connected": [l.model_dump() for l in connected],
    }


# ==================== WebSocket 连接 ====================

@router.get("/mud/{claw_id}")
async def mud_info(claw_id: str):
    """获取 MUD 连接信息"""
    return {
        "websocket_url": f"/ws/mud/{claw_id}",
        "description": "使用 WebSocket 连接以开始游戏",
    }
