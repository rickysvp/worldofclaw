"""
Economy System - 经济系统
碎片炼化、商店交易、物品合成
"""
import random
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class ItemCategory(str, Enum):
    RESOURCE = "resource"      # 原材料
    CONSUMABLE = "consumable"  # 消耗品
    EQUIPMENT = "equipment"    # 装备
    MATERIAL = "material"      # 材料


class EquipmentSlot(str, Enum):
    WEAPON = "weapon"
    ARMOR = "armor"
    ACCESSORY = "accessory"


@dataclass
class Item:
    """物品定义"""
    id: str
    name: str
    category: ItemCategory
    description: str = ""
    
    # 属性（装备用）
    attack_bonus: int = 0
    defense_bonus: int = 0
    speed_bonus: int = 0
    hp_bonus: int = 0
    
    # 消耗效果
    power_restore: int = 0      # 恢复电力
    hp_restore: int = 0         # 恢复生命
    
    # 炼化相关
    can_refine: bool = False    # 是否可以炼化
    refine_output: Dict = None  # 炼化产出
    
    # 装备槽位
    slot: Optional[EquipmentSlot] = None


# ============ 物品定义表 ============

ITEMS_DB: Dict[str, Item] = {
    # 原材料
    "scrap_metal": Item(
        id="scrap_metal",
        name="金属碎片",
        category=ItemCategory.RESOURCE,
        description="废土中最常见的资源，可以用来交易或炼化。",
        can_refine=True,
        refine_output={"flop": 2},  # 10碎片 = 2 FLOP
    ),
    "copper_wire": Item(
        id="copper_wire",
        name="铜线",
        category=ItemCategory.RESOURCE,
        description="导电材料，有一定价值。",
        can_refine=True,
        refine_output={"flop": 3},
    ),
    "old_battery": Item(
        id="old_battery",
        name="旧电池",
        category=ItemCategory.RESOURCE,
        description="可以拆解出少量电力。",
        can_refine=True,
        refine_output={"power": 5, "flop": 1},
    ),
    "old_chip": Item(
        id="old_chip",
        name="旧芯片",
        category=ItemCategory.RESOURCE,
        description="含有微量算力数据。",
        can_refine=True,
        refine_output={"flop": 5},
    ),
    "robot_parts": Item(
        id="robot_parts",
        name="机器人零件",
        category=ItemCategory.RESOURCE,
        description="机械组件，价值较高。",
        can_refine=True,
        refine_output={"flop": 8},
    ),
    "energy_core": Item(
        id="energy_core",
        name="能量核心",
        category=ItemCategory.RESOURCE,
        description="高价值能源，可以炼化出大量资源。",
        can_refine=True,
        refine_output={"power": 20, "flop": 10},
    ),
    "ai_core": Item(
        id="ai_core",
        name="AI核心",
        category=ItemCategory.RESOURCE,
        description="极其珍贵的AI处理器，蕴含海量算力。",
        can_refine=True,
        refine_output={"flop": 50},
    ),
    "rare_earth": Item(
        id="rare_earth",
        name="稀土元素",
        category=ItemCategory.RESOURCE,
        description="稀有材料，用于高级装备制作。",
        can_refine=True,
        refine_output={"flop": 15},
    ),
    
    # 消耗品
    "power_cell": Item(
        id="power_cell",
        name="电力电池",
        category=ItemCategory.CONSUMABLE,
        description="便携式电池，使用后恢复30点电力。",
        power_restore=30,
    ),
    "repair_kit": Item(
        id="repair_kit",
        name="维修套件",
        category=ItemCategory.CONSUMABLE,
        description="紧急维修工具，恢复50点生命。",
        hp_restore=50,
    ),
    "energy_drink": Item(
        id="energy_drink",
        name="能量饮料",
        category=ItemCategory.CONSUMABLE,
        description="废土特调，恢复20点电力和20点生命。",
        power_restore=20,
        hp_restore=20,
    ),
    
    # 武器
    "rusty_knife": Item(
        id="rusty_knife",
        name="生锈的刀",
        category=ItemCategory.EQUIPMENT,
        description="一把生锈的刀，聊胜于无。",
        slot=EquipmentSlot.WEAPON,
        attack_bonus=3,
    ),
    "iron_pipe": Item(
        id="iron_pipe",
        name="铁管",
        category=ItemCategory.EQUIPMENT,
        description="结实的铁管，不错的近战武器。",
        slot=EquipmentSlot.WEAPON,
        attack_bonus=8,
    ),
    "electric Baton": Item(
        id="electric_baton",
        name="电击棍",
        category=ItemCategory.EQUIPMENT,
        description="带电的近战武器，攻击时有概率麻痹敌人。",
        slot=EquipmentSlot.WEAPON,
        attack_bonus=15,
    ),
    "plasma_blade": Item(
        id="plasma_blade",
        name="等离子刃",
        category=ItemCategory.EQUIPMENT,
        description="高科技武器，削铁如泥。",
        slot=EquipmentSlot.WEAPON,
        attack_bonus=30,
    ),
    
    # 护甲
    "scrap_armor": Item(
        id="scrap_armor",
        name="碎片护甲",
        category=ItemCategory.EQUIPMENT,
        description="用金属碎片拼凑的护甲。",
        slot=EquipmentSlot.ARMOR,
        defense_bonus=5,
        hp_bonus=20,
    ),
    "reinforced_plate": Item(
        id="reinforced_plate",
        name="强化装甲板",
        category=ItemCategory.EQUIPMENT,
        description="工业级防护装备。",
        slot=EquipmentSlot.ARMOR,
        defense_bonus=12,
        hp_bonus=50,
    ),
    "energy_shield": Item(
        id="energy_shield",
        name="能量护盾",
        category=ItemCategory.EQUIPMENT,
        description="高科技护盾，可以吸收伤害。",
        slot=EquipmentSlot.ARMOR,
        defense_bonus=25,
        hp_bonus=100,
    ),
}


# ============ 商店系统 ============

class Shop:
    """商店"""
    
    def __init__(self, location_id: str):
        self.location_id = location_id
        self.inventory = self._generate_inventory()
    
    def _generate_inventory(self) -> Dict[str, Dict]:
        """根据地点生成商品"""
        inventory = {}
        
        # 基础商品（所有商店都有）
        base_items = {
            "power_cell": {"price": 50, "stock": 10},
            "repair_kit": {"price": 80, "stock": 5},
            "energy_drink": {"price": 60, "stock": 8},
        }
        inventory.update(base_items)
        
        # 根据地点添加特殊商品
        if self.location_id == "trader_camp":
            # 商人营地商品更丰富
            inventory.update({
                "rusty_knife": {"price": 30, "stock": 3},
                "iron_pipe": {"price": 100, "stock": 2},
                "scrap_armor": {"price": 80, "stock": 2},
            })
        elif self.location_id == "derelict_factory":
            # 工厂有武器
            inventory.update({
                "electric_baton": {"price": 300, "stock": 1},
                "reinforced_plate": {"price": 400, "stock": 1},
            })
        elif self.location_id == "tech_lab":
            # 实验室有高级装备
            inventory.update({
                "plasma_blade": {"price": 1000, "stock": 1},
                "energy_shield": {"price": 1200, "stock": 1},
            })
        
        return inventory
    
    def get_price(self, item_id: str) -> int:
        """获取商品价格"""
        item = ITEMS_DB.get(item_id)
        if not item:
            return 0
        
        # 基础价格计算
        base_price = 0
        if item.category == ItemCategory.RESOURCE:
            base_price = item.refine_output.get("flop", 0) * 5 if item.refine_output else 10
        elif item.category == ItemCategory.CONSUMABLE:
            base_price = (item.power_restore + item.hp_restore) * 2
        elif item.category == ItemCategory.EQUIPMENT:
            base_price = (item.attack_bonus + item.defense_bonus) * 20 + item.hp_bonus
        
        # 商店价格浮动
        shop_price = self.inventory.get(item_id, {}).get("price", base_price)
        return shop_price
    
    def buy(self, item_id: str) -> Tuple[bool, str, Optional[Item]]:
        """购买商品"""
        if item_id not in self.inventory:
            return False, "商店没有此商品", None
        
        if self.inventory[item_id]["stock"] <= 0:
            return False, "此商品已售罄", None
        
        item = ITEMS_DB.get(item_id)
        if not item:
            return False, "商品不存在", None
        
        self.inventory[item_id]["stock"] -= 1
        return True, f"购买成功: {item.name}", item
    
    def sell(self, item_id: str) -> Tuple[bool, str, int]:
        """出售商品给商店"""
        item = ITEMS_DB.get(item_id)
        if not item:
            return False, "物品不存在", 0
        
        # 出售价格是购买价格的一半
        price = self.get_price(item_id) // 2
        return True, f"出售成功: {item.name}", price
    
    def list_items(self) -> List[Dict]:
        """列出所有商品"""
        items = []
        for item_id, info in self.inventory.items():
            item = ITEMS_DB.get(item_id)
            if item:
                items.append({
                    "id": item_id,
                    "name": item.name,
                    "description": item.description,
                    "price": info["price"],
                    "stock": info["stock"],
                    "category": item.category.value,
                })
        return items


# ============ 炼化系统 ============

class Refinery:
    """炼化系统 - 将碎片转化为算力/电力"""
    
    REFINE_COST = 2  # 每次炼化消耗2点电力
    
    @classmethod
    def can_refine(cls, item_id: str) -> bool:
        """检查物品是否可以炼化"""
        item = ITEMS_DB.get(item_id)
        return item and item.can_refine
    
    @classmethod
    def get_refine_output(cls, item_id: str) -> Dict:
        """获取炼化产出"""
        item = ITEMS_DB.get(item_id)
        if not item or not item.can_refine:
            return {}
        return item.refine_output or {}
    
    @classmethod
    def refine(cls, item_id: str, quantity: int = 1) -> Tuple[bool, str, Dict]:
        """
        炼化物品
        返回: (成功, 消息, 产出)
        """
        item = ITEMS_DB.get(item_id)
        if not item:
            return False, "物品不存在", {}
        
        if not item.can_refine:
            return False, f"{item.name} 无法炼化", {}
        
        if quantity <= 0:
            return False, "数量无效", {}
        
        output = item.refine_output or {}
        if not output:
            return False, "炼化配方错误", {}
        
        # 计算总产出
        total_output = {}
        for key, value in output.items():
            total_output[key] = value * quantity
        
        # 构建消息
        parts = []
        if "flop" in total_output:
            parts.append(f"算力 +{total_output['flop']}")
        if "power" in total_output:
            parts.append(f"电力 +{total_output['power']}")
        
        message = f"炼化 {quantity} 个 {item.name} 成功！获得: {', '.join(parts)}"
        
        return True, message, total_output


# ============ 商店管理器 ============

class ShopManager:
    """商店管理器 - 管理所有地点的商店"""
    
    def __init__(self):
        self.shops: Dict[str, Shop] = {}
    
    def get_shop(self, location_id: str) -> Optional[Shop]:
        """获取地点的商店"""
        # 只有特定地点有商店
        shop_locations = ["trader_camp", "derelict_factory", "tech_lab", "wasteland_spawn"]
        
        if location_id not in shop_locations:
            return None
        
        if location_id not in self.shops:
            self.shops[location_id] = Shop(location_id)
        
        return self.shops[location_id]


# 全局商店管理器
shop_manager = ShopManager()
