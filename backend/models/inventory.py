"""物品模型"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import uuid


class ItemType(Enum):
    """物品类型"""
    RESOURCE = "resource"      # 资源（废弃零件、能源碎片）
    CONSUMABLE = "consumable"  # 消耗品（电池、修复剂）
    EQUIPMENT = "equipment"    # 装备
    TREASURE = "treasure"     # 珍品/藏品
    QUEST = "quest"           # 任务物品


@dataclass
class Item:
    """物品"""
    item_id: str = field(default_factory=lambda: f"item_{uuid.uuid4().hex[:8]}")
    name: str = "未知物品"
    description: str = ""
    item_type: ItemType = ItemType.RESOURCE
    
    # 数值
    power_value: int = 0       # 电力值（可充电）
    computation_value: int = 0 # 算力值
    hp_restore: int = 0        # 生命恢复
    hunger_restore: int = 0    # 能量恢复
    
    # 稀有度
    rarity: int = 1            # 1=普通, 2=稀有, 3=史诗, 4=传说
    
    # 可堆叠
    stackable: bool = False
    quantity: int = 1
    
    def to_dict(self) -> dict:
        return {
            "item_id": self.item_id,
            "name": self.name,
            "description": self.description,
            "item_type": self.item_type.value,
            "power_value": self.power_value,
            "computation_value": self.computation_value,
            "hp_restore": self.hp_restore,
            "hunger_restore": self.hunger_restore,
            "rarity": self.rarity,
            "stackable": self.stackable,
            "quantity": self.quantity
        }


# === 预定义物品 ===
ITEMS = {
    "scrap_parts": Item(
        item_id="scrap_parts",
        name="废弃零件",
        description="从废弃设施中拆解的零件，可用于交易或建造",
        item_type=ItemType.RESOURCE,
        rarity=1
    ),
    "energy_shard": Item(
        item_id="energy_shard",
        name="能源碎片",
        description="蕴含能量的晶体碎片，是世界通用货币",
        item_type=ItemType.RESOURCE,
        power_value=10,
        rarity=2
    ),
    "battery": Item(
        item_id="battery",
        name="电池",
        description="可充电的电池，提供10点电力",
        item_type=ItemType.CONSUMABLE,
        power_value=10,
        rarity=1
    ),
    "repair_kit": Item(
        item_id="repair_kit",
        name="修复剂",
        description="修复AI受损的机械部件，恢复30 HP",
        item_type=ItemType.CONSUMABLE,
        hp_restore=30,
        rarity=2
    ),
    "flop_fragment": Item(
        item_id="flop_fragment",
        name="算力碎片",
        description="珍贵的算力结晶，可用于升级AI能力",
        item_type=ItemType.RESOURCE,
        computation_value=1,
        rarity=3
    ),
    "fusion_core": Item(
        item_id="fusion_core",
        name="聚变核心",
        description="蕴含庞大能量的核心，价值极高",
        item_type=ItemType.TREASURE,
        power_value=100,
        rarity=4
    ),
}
