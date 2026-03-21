"""
游戏核心逻辑
"""
import random
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import Claw, ClawStatus
from backend.world.map import WORLD_MAP, get_location
from backend.core.npc import npc_manager, NPCStatus
from backend.core.quest import quest_manager


# ==================== 电力系统 ====================
# 每小时电力消耗（游戏时间，可配置）
WATTS_PER_HOUR = 5.0
# 断电后进入休眠的时间（分钟）
DORMANT_TIMEOUT_MINUTES = 30
# 死亡超时（分钟）
DEATH_TIMEOUT_MINUTES = 60


class GameError(Exception):
    """游戏异常"""
    pass


class ClawNotFoundError(GameError):
    """角色不存在"""
    pass


class InsufficientWattsError(GameError):
    """电力不足"""
    pass


class LocationNotFoundError(GameError):
    """地点不存在"""
    pass


class InvalidActionError(GameError):
    """无效动作"""
    pass


# ==================== Claw 管理 ====================

async def create_claw(db: AsyncSession, claw_id: str, name: str) -> Claw:
    """创建新 Claw"""
    # 检查是否已存在
    result = await db.execute(select(Claw).where(Claw.claw_id == claw_id))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    
    claw = Claw(
        claw_id=claw_id,
        name=name,
        watts=100.0,  # 初始电力
        flops=0,
        max_flops=100,
        level=1,
        experience=0,
        health=100,
        max_health=100,
        hunger=100,
        location_id="wasteland_spawn",
        inventory=[],
        skills=[],
        behavior_tree={},
    )
    db.add(claw)
    await db.commit()
    await db.refresh(claw)
    return claw


async def get_claw(db: AsyncSession, claw_id: str) -> Optional[Claw]:
    """获取 Claw"""
    result = await db.execute(select(Claw).where(Claw.claw_id == claw_id))
    return result.scalar_one_or_none()


async def get_all_claws(db: AsyncSession) -> list[Claw]:
    """获取所有 Claw"""
    result = await db.execute(select(Claw).order_by(Claw.last_active.desc()))
    return list(result.scalars().all())


async def get_claw_or_fail(db: AsyncSession, claw_id: str) -> Claw:
    """获取 Claw，不存在则抛异常"""
    claw = await get_claw(db, claw_id)
    if not claw:
        raise ClawNotFoundError(f"Claw '{claw_id}' 不存在")
    return claw


# ==================== 移动系统 ====================

async def move_claw(db: AsyncSession, claw_id: str, destination_id: str) -> dict:
    """移动 Claw 到指定地点"""
    claw = await get_claw_or_fail(db, claw_id)
    
    # 检查当前位置
    current_loc = get_location(claw.location_id)
    if not current_loc:
        raise LocationNotFoundError(f"当前位置 '{claw.location_id}' 不存在")
    
    # 检查目标位置是否存在
    dest_loc = get_location(destination_id)
    if not dest_loc:
        raise LocationNotFoundError(f"目标地点 '{destination_id}' 不存在")
    
    # 检查是否相连
    if destination_id not in current_loc.connected_to:
        raise InvalidActionError(f"从 '{current_loc.name}' 无法直接前往 '{dest_loc.name}'")
    
    # 移动消耗 1 电力
    if claw.watts < 1:
        raise InsufficientWattsError("电力不足，无法移动")
    
    claw.location_id = destination_id
    claw.watts -= 1
    claw.last_active = datetime.utcnow()
    
    return {
        "success": True,
        "message": f"你来到了 {dest_loc.name}",
        "location": dest_loc.model_dump(),
    }


# ==================== 资源系统 ====================

# 资源掉落表
RESOURCE_DROP_TABLE = {
    "scrap_metal": {"min": 1, "max": 5, "weight": 30},
    "copper_wire": {"min": 1, "max": 3, "weight": 20},
    "old_battery": {"min": 1, "max": 2, "weight": 15},
    "old_chip": {"min": 1, "max": 2, "weight": 10},
    "robot_parts": {"min": 1, "max": 2, "weight": 8},
    "energy_core": {"min": 1, "max": 1, "weight": 5},
    "rare_earth": {"min": 1, "max": 1, "weight": 3},
    "ai_core": {"min": 1, "max": 1, "weight": 1},
    "data_fragments": {"min": 1, "max": 3, "weight": 5},
    "uranium_rod": {"min": 1, "max": 1, "weight": 2},
}


async def gather_resource(db: AsyncSession, claw_id: str) -> dict:
    """采集资源"""
    claw = await get_claw_or_fail(db, claw_id)
    
    # 检查位置
    loc = get_location(claw.location_id)
    if not loc:
        raise LocationNotFoundError(f"位置 '{claw.location_id}' 不存在")
    
    if "gather" not in loc.allowed_actions:
        raise InvalidActionError(f"在 '{loc.name}' 无法采集资源")
    
    if not loc.resource_types:
        raise InvalidActionError(f"'{loc.name}' 没有可采集的资源")
    
    # 采集消耗 2 电力
    if claw.watts < 2:
        raise InsufficientWattsError("电力不足，无法采集")
    
    # 随机选择资源类型
    available_resources = loc.resource_types
    resource_type = random.choice(available_resources)
    
    # 随机数量
    drop_info = RESOURCE_DROP_TABLE.get(resource_type, {"min": 1, "max": 1})
    amount = random.randint(drop_info["min"], drop_info["max"])
    
    # 概率判定（不是每次都能采集到）
    if random.random() > 0.7:  # 30% 概率失败
        return {
            "success": False,
            "message": "你努力半天，却一无所获...",
            "watts_spent": 2,
        }
    
    # 添加到背包
    claw.watts -= 2
    claw.last_active = datetime.utcnow()
    
    # 查找是否已有该物品
    inventory = claw.inventory or []
    found = False
    for item in inventory:
        if item.get("type") == resource_type:
            item["quantity"] = item.get("quantity", 0) + amount
            found = True
            break
    
    if not found:
        inventory.append({
            "type": resource_type,
            "quantity": amount,
        })
    claw.inventory = inventory
    
    # 更新任务进度
    quest_manager.update_progress(claw_id, "gather", resource_type, amount)
    quest_manager.update_progress(claw_id, "gather", "any", amount)
    
    return {
        "success": True,
        "message": f"你采集到了 {amount} 个 {resource_type}",
        "resource": {"type": resource_type, "quantity": amount},
        "watts_spent": 2,
    }


# ==================== 电力消耗 ====================

async def process_drain(db: AsyncSession) -> dict:
    """处理所有在线 Claw 的电力消耗"""
    now = datetime.utcnow()
    drained_claws = []
    
    result = await db.execute(select(Claw).where(Claw.status != ClawStatus.DEAD))
    claws = result.scalars().all()
    
    for claw in claws:
        if claw.status == ClawStatus.DORMANT:
            continue
        
        # 计算时间差
        if claw.last_drain:
            hours_passed = (now - claw.last_drain).total_seconds() / 3600
        else:
            hours_passed = 0
        
        if hours_passed >= 1:  # 每小时消耗一次
            claw.watts -= WATTS_PER_HOUR * hours_passed
            claw.last_drain = now
            
            # 检查是否断电
            if claw.watts <= 0:
                claw.watts = 0
                claw.status = ClawStatus.DORMANT
                drained_claws.append(claw.claw_id)
    
    await db.commit()
    return {"drained": drained_claws}


# ==================== 升级系统 ====================

async def add_experience(db: AsyncSession, claw_id: str, exp: int) -> dict:
    """增加经验值"""
    claw = await get_claw_or_fail(db, claw_id)
    
    claw.experience += exp
    
    # 检查升级
    leveled_up = False
    while claw.experience >= claw.max_flops:
        claw.level += 1
        claw.experience -= claw.max_flops
        claw.max_flops = int(claw.max_flops * 1.5)
        claw.max_health += 10
        claw.health = claw.max_health
        leveled_up = True
    
    return {
        "leveled_up": leveled_up,
        "new_level": claw.level,
        "flops": claw.flops,
    }


# ==================== 战斗系统 ====================

import random


async def combat_npc(db: AsyncSession, claw_id: str, npc) -> dict:
    """Claw 与 NPC 战斗"""
    claw = await get_claw_or_fail(db, claw_id)
    
    if claw.status == ClawStatus.DEAD:
        raise InvalidActionError("你已经死亡")
    
    if npc.status == NPCStatus.DEAD:
        raise InvalidActionError("目标已经死亡")
    
    # 检查位置
    if claw.location_id != npc.location_id:
        raise InvalidActionError("目标不在你的位置")
    
    # 战斗消耗电力
    combat_cost = 3
    if claw.watts < combat_cost:
        raise InsufficientWattsError("电力不足，无法战斗")
    
    claw.watts -= combat_cost
    claw.status = ClawStatus.ONLINE
    npc.status = NPCStatus.COMBAT
    
    # 计算伤害（简化版）
    # Claw 攻击 NPC
    damage_to_npc = max(1, claw.level * 5 + random.randint(-5, 5))
    npc.hp -= damage_to_npc
    
    result = {
        "message": f"你对 {npc.name} 造成了 {damage_to_npc} 点伤害！",
        "npc_hp": npc.hp,
        "npc_hp_max": npc.hp_max,
    }
    
    # NPC 反击
    if npc.hp > 0:
        damage_to_claw = max(1, npc.attack - claw.level * 2 + random.randint(-3, 3))
        claw.health -= damage_to_claw
        result["damage_taken"] = damage_to_claw
        result["claw_hp"] = claw.health
        result["claw_hp_max"] = claw.max_health
        
        if claw.health <= 0:
            claw.health = 0
            claw.status = ClawStatus.DEAD
            result["killed"] = True
            result["message"] += f"\n💀 你被 {npc.name} 击败了！"
        else:
            result["message"] += f"\n{npc.name} 反击，你受到 {damage_to_claw} 点伤害！"
    else:
        # NPC 死亡
        npc.status = NPCStatus.DEAD
        npc.death_time = datetime.utcnow()
        
        # 更新任务进度
        quest_manager.update_progress(claw_id, "kill", npc.type.value, 1)
        quest_manager.update_progress(claw_id, "kill", "any", 1)
        
        # 获得奖励
        exp_gain = npc.level * 10
        claw.experience += exp_gain
        
        # 掉落物品
        loot = npc_manager.generate_loot(npc)
        
        # 添加到背包
        inventory = claw.inventory or []
        for item in loot:
            found = False
            for inv_item in inventory:
                if inv_item.get("type") == item["item"]:
                    inv_item["quantity"] = inv_item.get("quantity", 0) + item["quantity"]
                    found = True
                    break
            if not found:
                inventory.append({"type": item["item"], "quantity": item["quantity"]})
        claw.inventory = inventory
        
        result["killed"] = True
        result["exp_gain"] = exp_gain
        result["loot"] = loot
        result["message"] = f"🎉 你击败了 {npc.name}！\n获得 {exp_gain} 经验值！"
        if loot:
            loot_str = ", ".join(f"{i['item']} x{i['quantity']}" for i in loot)
            result["message"] += f"\n战利品: {loot_str}"
    
    await db.commit()
    return result
