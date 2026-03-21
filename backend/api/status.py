"""
世界状态 API - 给前端观察页面用
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from server.core.database import get_db
from server.api.websocket import manager
from server.core.events import event_manager
from server.core import game

router = APIRouter()


@router.get("/status")
async def world_status(db: AsyncSession = Depends(get_db)):
    """获取世界状态概览"""
    all_claws = await game.get_all_claws(db)
    
    return {
        "online_claws": list(manager.online_claws),
        "online_count": len(manager.online_claws),
        "tick": event_manager.current_tick if hasattr(event_manager, 'current_tick') else 0,
        "total_claws": len(all_claws),
    }


@router.get("/claws")
async def list_claws(db: AsyncSession = Depends(get_db)):
    """列出所有角色"""
    all_claws = await game.get_all_claws(db)
    return {
        "claws": [claw.to_dict() for claw in all_claws],
        "total": len(all_claws),
    }
