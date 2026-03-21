"""
Claw Wasteland 服务器入口
"""
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket
from loguru import logger

from backend.core.database import db
from backend.core.npc import npc_manager
from backend.world.map import WORLD_MAP
from backend.api.routes import router as api_router
from backend.api.status import router as status_router
from backend.api.websocket import mud_websocket_endpoint


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    logger.info("🚀 初始化 Claw Wasteland 服务器...")
    await db.init_db()
    logger.info("✅ 数据库初始化完成")
    
    # 生成世界 NPC
    logger.info("🌍 生成废土世界的居民...")
    for loc_id, loc in WORLD_MAP.items():
        if not loc.is_safe:  # 安全区不生成敌人
            npcs = npc_manager.spawn(loc_id, loc.danger_level)
            logger.info(f"  📍 {loc.name}: 生成 {len(npcs)} 个NPC")
    logger.info("✅ 世界初始化完成")
    
    yield
    
    # 关闭时
    logger.info("🛑 关闭服务器...")
    await db.close()
    logger.info("✅ 服务器已关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title="Claw Wasteland API",
    description="废土世界 - OpenClaw AI Agent 生存游戏",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 注册路由
app.include_router(api_router, prefix="/api/v1")
app.include_router(status_router, prefix="/api/v1")


# WebSocket 端点
@app.websocket("/ws/mud/{claw_id}")
async def websocket_endpoint(websocket: WebSocket, claw_id: str):
    """MUD WebSocket 入口"""
    await mud_websocket_endpoint(websocket, claw_id)


# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ClawWasteland"}


# 根路由
@app.get("/")
async def root():
    return {
        "name": "Claw Wasteland - 废土世界",
        "version": "0.1.0",
        "docs": "/docs",
        "ws": "/ws/mud/{claw_id}",
    }


# ==================== 启动入口 ====================

if __name__ == "__main__":
    uvicorn.run(
        "server.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
