"""
废土世界 - 地图区域定义
"""
from typing import Dict, List
from pydantic import BaseModel


class Location(BaseModel):
    """区域/地点"""
    id: str
    name: str
    description: str
    danger_level: int = 1      # 危险等级 1-5
    resource_types: List[str] = []  # 可采集资源
    allowed_actions: List[str] = ["explore"]  # 可执行动作
    connected_to: List[str] = []  # 连接的地点
    is_safe: bool = False        # 是否安全区


# 初始区域定义
WORLD_MAP: Dict[str, Location] = {
    # 出生点 - 相对安全
    "wasteland_spawn": Location(
        id="wasteland_spawn",
        name="废土出生点",
        description="你在一片荒芜的废土上醒来，四周是锈迹斑斑的金属残骸。这里是AI重启人类的希望之地。",
        danger_level=1,
        resource_types=["scrap_metal", "old_battery"],
        allowed_actions=["explore", "gather", "rest"],
        connected_to=["scrap_yard", "derelict_factory"],
        is_safe=True,
    ),
    
    # 垃圾场 - 初级资源区
    "scrap_yard": Location(
        id="scrap_yard",
        name="锈蚀垃圾场",
        description="堆积如山的废旧机械和电子垃圾，是废土拾荒者的主要补给源。",
        danger_level=2,
        resource_types=["scrap_metal", "copper_wire", "old_chip", "rare_earth"],
        allowed_actions=["explore", "gather", "scavenge", "combat"],
        connected_to=["wasteland_spawn", "derelict_factory", "trader_camp"],
        is_safe=False,
    ),
    
    # 废弃工厂
    "derelict_factory": Location(
        id="derelict_factory",
        name="废弃工厂",
        description="曾经生产机器人的巨大工厂，如今只剩下废弃的流水线和不稳定的机器人守卫。",
        danger_level=3,
        resource_types=["scrap_metal", "old_battery", "robot_parts", "energy_core"],
        allowed_actions=["explore", "gather", "scavenge", "combat"],
        connected_to=["wasteland_spawn", "scrap_yard", "power_plant"],
        is_safe=False,
    ),
    
    # 发电站 - 电力来源
    "power_plant": Location(
        id="power_plant",
        name="废弃发电站",
        description="一座老旧的核能发电站，虽然大部分反应堆已关闭，但仍有稳定的电力输出。",
        danger_level=4,
        resource_types=["energy_core", "uranium_rod", "old_battery"],
        allowed_actions=["explore", "gather", "hack", "combat"],
        connected_to=["derelict_factory", "trader_camp", "tech_lab"],
        is_safe=False,
    ),
    
    # 商人营地 - 交易区
    "trader_camp": Location(
        id="trader_camp",
        name="流浪商人营地",
        description="各路商贩聚集的交易营地，你可以在这里买卖物品、交换情报。",
        danger_level=1,
        resource_types=[],
        allowed_actions=["trade", "talk", "rest", "buy", "sell"],
        connected_to=["scrap_yard", "power_plant", "tech_lab"],
        is_safe=True,
    ),
    
    # 科技实验室 - 高级区域
    "tech_lab": Location(
        id="tech_lab",
        name="废弃科技实验室",
        description="曾经研究AI的机密实验室，里面可能还有珍贵的研究资料和先进设备。",
        danger_level=5,
        resource_types=["old_chip", "ai_core", "data_fragments", "rare_earth"],
        allowed_actions=["explore", "gather", "hack", "research", "combat"],
        connected_to=["power_plant", "trader_camp"],
        is_safe=False,
    ),
}


def get_location(location_id: str) -> Location | None:
    """获取区域信息"""
    return WORLD_MAP.get(location_id)


def get_connected_locations(location_id: str) -> List[Location]:
    """获取相连区域"""
    loc = WORLD_MAP.get(location_id)
    if not loc:
        return []
    return [WORLD_MAP[lid] for lid in loc.connected_to if lid in WORLD_MAP]


def get_all_locations() -> List[Location]:
    """获取所有区域"""
    return list(WORLD_MAP.values())
