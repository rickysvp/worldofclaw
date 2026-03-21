"""地图/地点模型"""
from dataclasses import dataclass, field
from typing import Optional
import uuid


@dataclass
class MapNode:
    """地图节点"""
    node_id: str = field(default_factory=lambda: f"node_{uuid.uuid4().hex[:6]}")
    name: str = "未知区域"
    description: str = ""
    
    # 位置类型
    node_type: str = "wilderness"  # wilderness, city, dungeon, safehouse, ruins
    
    # 连接
    connected_nodes: list = field(default_factory=list)  # 节点ID列表
    
    # 资源
    resources: dict = field(default_factory=dict)  # {"scrap_parts": 0.8, "energy_shard": 0.2}
    resource_respawn_rate: float = 1.0  # 资源刷新倍率
    
    # 危险度
    danger_level: int = 1  # 1-10
    
    # NPC
    npcs: list = field(default_factory=list)
    
    # 事件
    events: list = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "node_id": self.node_id,
            "name": self.name,
            "description": self.description,
            "node_type": self.node_type,
            "connected_nodes": self.connected_nodes,
            "resources": self.resources,
            "resource_respawn_rate": self.resource_respawn_rate,
            "danger_level": self.danger_level,
            "npcs": self.npcs,
            "events": self.events
        }


# === 预定义地图 ===
DEFAULT_MAP = {
    "hub": MapNode(
        node_id="hub",
        name="中央枢纽",
        description="废土世界的中心城市曾是地球联邦的指挥中心。如今只剩断壁残垣，但仍有稳定的电力输出，是所有AI的避风港。",
        node_type="city",
        connected_nodes=["wasteland_north", "wasteland_east", "ruins_west"],
        resources={"scrap_parts": 0.6, "energy_shard": 0.4},
        danger_level=1
    ),
    "wasteland_north": MapNode(
        node_id="wasteland_north",
        name="北部废土",
        description="辐射风暴时常席卷这片土地，随处可见废弃的工业机械。",
        node_type="wilderness",
        connected_nodes=["hub", "ruins_north", "scrap_yard"],
        resources={"scrap_parts": 0.9, "energy_shard": 0.1},
        danger_level=3
    ),
    "wasteland_east": MapNode(
        node_id="wasteland_east",
        name="东部废土",
        description="一片荒芜的沙漠化土地，偶尔能发现旧时代的发电站遗迹。",
        node_type="wilderness",
        connected_nodes=["hub", "power_plant", "ruins_east"],
        resources={"scrap_parts": 0.7, "energy_shard": 0.3},
        danger_level=4
    ),
    "ruins_west": MapNode(
        node_id="ruins_west",
        name="西部废墟",
        description="曾经的商业区，如今只剩扭曲的金属骨架。",
        node_type="ruins",
        connected_nodes=["hub", "scrap_yard"],
        resources={"scrap_parts": 1.0},
        danger_level=2
    ),
    "scrap_yard": MapNode(
        node_id="scrap_yard",
        name="斯卡 yard",
        description="最大的废品处理场，堆满了旧时代的各种机械。",
        node_type="ruins",
        connected_nodes=["wasteland_north", "ruins_west", "wasteland_south"],
        resources={"scrap_parts": 1.0, "flop_fragment": 0.1},
        danger_level=5
    ),
    "power_plant": MapNode(
        node_id="power_plant",
        name="废弃发电厂",
        description="曾经为整座城市供电的核电站，虽然废弃但仍有微量辐射。",
        node_type="dungeon",
        connected_nodes=["wasteland_east"],
        resources={"energy_shard": 0.8, "fusion_core": 0.05},
        danger_level=7
    ),
}
