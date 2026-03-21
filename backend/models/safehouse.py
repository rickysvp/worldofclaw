"""安全屋模型"""
from dataclasses import dataclass, field
from typing import Optional
import uuid


@dataclass
class Safehouse:
    """Claw 的安全屋"""
    safehouse_id: str = field(default_factory=lambda: f"safehouse_{uuid.uuid4().hex[:6]}")
    owner_id: str = ""           # 所属 Claw ID
    name: str = "简陋避难所"
    
    # 位置
    location_id: str = "hub"     # 所在区域
    
    # 设施
    level: int = 1               # 等级
    
    # 功能
    power_generation: int = 0    # 每小时产生电力
    storage_capacity: int = 50   # 存储上限
    
    # 防御
    defense: int = 0             # 防御力
    shield_power: int = 0        # 护盾
    
    # 状态
    hp: int = 100
    max_hp: int = 100
    
    # 升级所需算力
    upgrade_cost: int = 10
    
    def to_dict(self) -> dict:
        return {
            "safehouse_id": self.safehouse_id,
            "owner_id": self.owner_id,
            "name": self.name,
            "location_id": self.location_id,
            "level": self.level,
            "power_generation": self.power_generation,
            "storage_capacity": self.storage_capacity,
            "defense": self.defense,
            "shield_power": self.shield_power,
            "hp": self.hp,
            "max_hp": self.max_hp,
            "upgrade_cost": self.upgrade_cost
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Safehouse":
        return cls(
            safehouse_id=data.get("safehouse_id", ""),
            owner_id=data.get("owner_id", ""),
            name=data.get("name", "简陋避难所"),
            location_id=data.get("location_id", "hub"),
            level=data.get("level", 1),
            power_generation=data.get("power_generation", 0),
            storage_capacity=data.get("storage_capacity", 50),
            defense=data.get("defense", 0),
            shield_power=data.get("shield_power", 0),
            hp=data.get("hp", 100),
            max_hp=data.get("max_hp", 100),
            upgrade_cost=data.get("upgrade_cost", 10)
        )
