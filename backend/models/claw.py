"""
Claw 角色数据模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional, Dict
from sqlalchemy import String, Integer, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class ClawStatus(str, Enum):
    ONLINE = "online"      # 在线活跃
    IDLE = "idle"          # 空闲挂机
    DORMANT = "dormant"    # 休眠（断电）
    DEAD = "dead"          # 死亡


class Claw(Base):
    """AI 角色"""
    __tablename__ = "claws"

    id: Mapped[int] = mapped_column(primary_key=True)
    claw_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # OpenClaw Agent ID
    
    # 基础属性
    name: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(16), default=ClawStatus.IDLE.value)
    level: Mapped[int] = mapped_column(Integer, default=1)
    experience: Mapped[int] = mapped_column(Integer, default=0)
    
    # 核心资源
    watts: Mapped[float] = mapped_column(Float, default=100.0)        # 电力 = 金钱
    flops: Mapped[int] = mapped_column(Integer, default=0)            # 算力 = 经验值
    max_flops: Mapped[int] = mapped_column(Integer, default=100)      # 算力上限
    
    # 状态
    health: Mapped[int] = mapped_column(Integer, default=100)
    max_health: Mapped[int] = mapped_column(Integer, default=100)
    hunger: Mapped[int] = mapped_column(Integer, default=100)           # 饥饿度
    last_drain: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)  # 上次电力消耗
    
    # 位置
    location_id: Mapped[str] = mapped_column(String(64), default="wasteland_spawn")  # 当前区域
    safehouse_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)   # 安全屋位置
    
    # 背包（JSON 存储物品列表）
    inventory: Mapped[str] = mapped_column(JSON, default=list)
    
    # 技能（JSON 存储已解锁技能）
    skills: Mapped[str] = mapped_column(JSON, default=list)
    
    # 行为树配置（JSON）
    behavior_tree: Mapped[str] = mapped_column(JSON, default=dict)
    
    # 装备（JSON 存储已装备物品）
    equipment: Mapped[str] = mapped_column(JSON, default=dict)  # {"weapon": "item_id", "armor": "item_id"}
    
    # 基础属性（不含装备加成）
    base_attack: Mapped[int] = mapped_column(Integer, default=10)
    base_defense: Mapped[int] = mapped_column(Integer, default=5)
    base_speed: Mapped[int] = mapped_column(Integer, default=10)
    
    # 元数据
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_active: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # 区块链（未来）
    wallet_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    nft_token_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    def get_equipment_stats(self) -> Dict:
        """获取装备加成（需要在导入ITEMS_DB后调用）"""
        eq = self.equipment or {}
        return {
            "weapon": eq.get("weapon"),
            "armor": eq.get("armor"),
        }
    
    def to_dict(self):
        return {
            "id": self.id,
            "claw_id": self.claw_id,
            "name": self.name,
            "status": self.status,
            "level": self.level,
            "experience": self.experience,
            "watts": self.watts,
            "flops": self.flops,
            "max_flops": self.max_flops,
            "health": self.health,
            "max_health": self.max_health,
            "hunger": self.hunger,
            "location_id": self.location_id,
            "safehouse_id": self.safehouse_id,
            "inventory": self.inventory,
            "equipment": self.equipment,
            "skills": self.skills,
            "behavior_tree": self.behavior_tree,
            "base_attack": self.base_attack,
            "base_defense": self.base_defense,
            "base_speed": self.base_speed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_active": self.last_active.isoformat() if self.last_active else None,
        }
