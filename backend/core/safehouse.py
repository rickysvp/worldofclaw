"""
Safehouse System - 安全屋系统
建造、升级、防御自己的基地
"""
import random
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum


class SafehouseLevel(int, Enum):
    SHACK = 1           # 简陋棚屋
    BUNKER = 2          # 地下掩体
    FORTRESS = 3        # 堡垒
    CITADEL = 4         # 要塞
    STRONGHOLD = 5      # 据点


@dataclass
class Safehouse:
    """安全屋"""
    claw_id: str
    location_id: str        # 所在位置
    level: SafehouseLevel = SafehouseLevel.SHACK
    
    # 资源存储
    stored_power: float = 0.0       # 存储的电力
    stored_items: List[Dict] = field(default_factory=list)  # 存储的物品
    
    # 设施
    has_generator: bool = False     # 发电机
    has_workshop: bool = False      # 工坊
    has_garden: bool = False        # 种植园
    has_turret: bool = False        # 防御炮塔
    
    # 防御
    defense_level: int = 0          # 防御等级
    last_attack: Optional[datetime] = None  # 上次被攻击时间
    
    # 升级成本
    @classmethod
    def get_upgrade_cost(cls, level: SafehouseLevel) -> Dict:
        """获取升级成本"""
        costs = {
            SafehouseLevel.SHACK: {"scrap_metal": 50, "power": 100},
            SafehouseLevel.BUNKER: {"scrap_metal": 150, "copper_wire": 30, "power": 300},
            SafehouseLevel.FORTRESS: {"robot_parts": 20, "energy_core": 5, "power": 800},
            SafehouseLevel.CITADEL: {"ai_core": 2, "rare_earth": 10, "power": 2000},
            SafehouseLevel.STRONGHOLD: {"ai_core": 10, "energy_core": 20, "power": 5000},
        }
        return costs.get(level, {})
    
    @classmethod
    def get_level_name(cls, level: SafehouseLevel) -> str:
        """获取等级名称"""
        names = {
            SafehouseLevel.SHACK: "简陋棚屋",
            SafehouseLevel.BUNKER: "地下掩体",
            SafehouseLevel.FORTRESS: "废土堡垒",
            SafehouseLevel.CITADEL: "机械要塞",
            SafehouseLevel.STRONGHOLD: "废土据点",
        }
        return names.get(level, "未知")
    
    @property
    def power_generation(self) -> float:
        """每小时发电量"""
        base = 2.0 * self.level.value
        if self.has_generator:
            base *= 2
        return base
    
    @property
    def storage_capacity(self) -> int:
        """存储容量"""
        return 50 * self.level.value
    
    @property
    def defense_bonus(self) -> int:
        """防御加成"""
        return self.defense_level + (5 if self.has_turret else 0)
    
    def to_dict(self) -> Dict:
        return {
            "level": self.level.value,
            "level_name": self.get_level_name(self.level),
            "location": self.location_id,
            "power_generation": self.power_generation,
            "storage_capacity": self.storage_capacity,
            "stored_power": self.stored_power,
            "facilities": {
                "generator": self.has_generator,
                "workshop": self.has_workshop,
                "garden": self.has_garden,
                "turret": self.has_turret,
            },
            "defense_level": self.defense_level,
            "defense_bonus": self.defense_bonus,
        }


class SafehouseManager:
    """安全屋管理器"""
    
    def __init__(self):
        self.safehouses: Dict[str, Safehouse] = {}  # claw_id -> Safehouse
    
    def get_safehouse(self, claw_id: str) -> Optional[Safehouse]:
        """获取安全屋"""
        return self.safehouses.get(claw_id)
    
    def create_safehouse(self, claw_id: str, location_id: str) -> Tuple[bool, str, Safehouse]:
        """创建安全屋"""
        if claw_id in self.safehouses:
            return False, "你已经有安全屋了", self.safehouses[claw_id]
        
        safehouse = Safehouse(
            claw_id=claw_id,
            location_id=location_id,
        )
        self.safehouses[claw_id] = safehouse
        return True, f"安全屋建造完成！位于 {location_id}", safehouse
    
    def upgrade_safehouse(self, claw_id: str, inventory: List[Dict], power: float) -> Tuple[bool, str]:
        """升级安全屋"""
        safehouse = self.safehouses.get(claw_id)
        if not safehouse:
            return False, "你还没有安全屋"
        
        if safehouse.level == SafehouseLevel.STRONGHOLD:
            return False, "安全屋已达到最高等级"
        
        next_level = SafehouseLevel(safehouse.level.value + 1)
        cost = Safehouse.get_upgrade_cost(safehouse.level)
        
        # 检查电力
        if power < cost.get("power", 0):
            return False, f"电力不足，需要 {cost.get('power', 0)} 电力"
        
        # 检查材料
        inventory_dict = {item.get("type", ""): item.get("quantity", 0) for item in inventory}
        for item_id, required in cost.items():
            if item_id == "power":
                continue
            if inventory_dict.get(item_id, 0) < required:
                return False, f"材料不足，需要 {required} 个 {item_id}"
        
        # 扣除材料
        for item_id, required in cost.items():
            if item_id == "power":
                continue
            for item in inventory:
                if item.get("type") == item_id:
                    item["quantity"] -= required
                    if item["quantity"] <= 0:
                        inventory.remove(item)
                    break
        
        # 升级
        safehouse.level = next_level
        safehouse.defense_level += 2
        
        return True, f"安全屋升级到 {Safehouse.get_level_name(next_level)}！"
    
    def build_facility(self, claw_id: str, facility: str, inventory: List[Dict], power: float) -> Tuple[bool, str]:
        """建造设施"""
        safehouse = self.safehouses.get(claw_id)
        if not safehouse:
            return False, "你还没有安全屋"
        
        # 设施成本
        costs = {
            "generator": {"scrap_metal": 30, "copper_wire": 10, "power": 200},
            "workshop": {"scrap_metal": 50, "robot_parts": 5, "power": 300},
            "garden": {"rare_earth": 5, "power": 100},
            "turret": {"robot_parts": 10, "energy_core": 2, "power": 500},
        }
        
        if facility not in costs:
            return False, "未知设施"
        
        # 检查是否已建造
        if getattr(safehouse, f"has_{facility}", False):
            return False, "该设施已建造"
        
        cost = costs[facility]
        
        # 检查资源
        if power < cost.get("power", 0):
            return False, "电力不足"
        
        inventory_dict = {item.get("type", ""): item.get("quantity", 0) for item in inventory}
        for item_id, required in cost.items():
            if item_id == "power":
                continue
            if inventory_dict.get(item_id, 0) < required:
                return False, f"材料不足，缺少 {item_id}"
        
        # 扣除材料
        for item_id, required in cost.items():
            if item_id == "power":
                continue
            for item in inventory:
                if item.get("type") == item_id:
                    item["quantity"] -= required
                    if item["quantity"] <= 0:
                        inventory.remove(item)
                    break
        
        # 建造
        setattr(safehouse, f"has_{facility}", True)
        
        facility_names = {
            "generator": "发电机",
            "workshop": "工坊",
            "garden": "种植园",
            "turret": "防御炮塔",
        }
        
        return True, f"建造完成: {facility_names.get(facility, facility)}"
    
    def process_tick(self):
        """处理世界tick - 发电、随机事件等"""
        for safehouse in self.safehouses.values():
            # 发电
            safehouse.stored_power = min(
                safehouse.storage_capacity,
                safehouse.stored_power + safehouse.power_generation
            )


# 全局安全屋管理器
safehouse_manager = SafehouseManager()
