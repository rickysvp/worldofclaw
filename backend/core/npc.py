"""
NPC / Enemy System - 废土世界的威胁
"""
import random
from enum import Enum
from typing import List, Optional, Dict
from dataclasses import dataclass, field
from datetime import datetime


class NPCType(str, Enum):
    SCAVENGER = "scavenger"      # 拾荒者（中立，可交易）
    ROGUE_BOT = "rogue_bot"      # 失控机器人（敌对）
    MUTANT = "mutant"            # 变异生物（敌对）
    BANDIT = "bandit"            # 强盗（敌对）
    TRADER = "trader"            # 商人（友好）
    GUARDIAN = "guardian"        # 守卫（区域Boss）


class NPCStatus(str, Enum):
    IDLE = "idle"                # 空闲
    PATROL = "patrol"            # 巡逻
    COMBAT = "combat"            # 战斗中
    DEAD = "dead"                # 死亡
    FLEE = "flee"                # 逃跑


@dataclass
class NPC:
    """NPC/敌人数据"""
    id: str
    name: str
    type: NPCType
    level: int = 1
    
    # 位置
    location_id: str = ""
    
    # 战斗属性
    hp: int = 50
    hp_max: int = 50
    attack: int = 5
    defense: int = 3
    speed: int = 10
    
    # AI行为
    status: NPCStatus = NPCStatus.IDLE
    aggression: float = 0.5        # 攻击性 0-1
    loot_table: List[Dict] = field(default_factory=list)
    
    # 刷新相关
    respawn_time: int = 300        # 死亡后刷新时间（秒）
    death_time: Optional[datetime] = None
    
    # 对话
    dialogues: List[str] = field(default_factory=list)
    
    def is_alive(self) -> bool:
        return self.status != NPCStatus.DEAD and self.hp > 0
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type.value,
            "level": self.level,
            "hp": self.hp,
            "hp_max": self.hp_max,
            "status": self.status.value,
            "aggression": self.aggression,
        }


# ============ NPC 模板 ============

NPC_TEMPLATES = {
    # 拾荒者 - 中立，可交易
    "scavenger": {
        "name_prefix": ["老", "年轻", "独眼", "瘸腿"],
        "name_suffix": ["拾荒者", "流浪汉", "废土客"],
        "type": NPCType.SCAVENGER,
        "level_range": (1, 3),
        "hp_range": (30, 60),
        "attack_range": (3, 8),
        "defense_range": (2, 5),
        "aggression": 0.1,
        "loot": [
            {"item": "scrap_metal", "min": 1, "max": 5, "chance": 0.8},
            {"item": "old_battery", "min": 1, "max": 2, "chance": 0.5},
            {"item": "copper_wire", "min": 1, "max": 3, "chance": 0.4},
        ],
        "dialogues": [
            "这片废土上，活着就是胜利。",
            "你有东西要交易吗？",
            "小心那些失控的机器人...",
            "听说发电站那边有好东西。",
        ],
    },
    
    # 失控机器人 - 低级敌人
    "rogue_bot": {
        "name_prefix": ["锈蚀", "破损", "老旧", "失控"],
        "name_suffix": ["清洁机器人", "安保机器人", "工业机器人", "无人机"],
        "type": NPCType.ROGUE_BOT,
        "level_range": (1, 4),
        "hp_range": (40, 80),
        "attack_range": (5, 12),
        "defense_range": (3, 8),
        "aggression": 0.7,
        "loot": [
            {"item": "scrap_metal", "min": 2, "max": 8, "chance": 0.9},
            {"item": "old_chip", "min": 1, "max": 2, "chance": 0.6},
            {"item": "robot_parts", "min": 1, "max": 2, "chance": 0.4},
            {"item": "energy_core", "min": 1, "max": 1, "chance": 0.2},
        ],
        "dialogues": [
            "警...警告...入侵者...",
            "系统...错误...清除...",
            "哔...哔...威胁检测...",
        ],
    },
    
    # 变异生物 - 中级敌人
    "mutant": {
        "name_prefix": ["辐射", "畸形", "狂暴", "毒液"],
        "name_suffix": ["鼠群", "蟑螂", "野狗", "变异体"],
        "type": NPCType.MUTANT,
        "level_range": (2, 5),
        "hp_range": (60, 120),
        "attack_range": (8, 18),
        "defense_range": (4, 10),
        "aggression": 0.8,
        "loot": [
            {"item": "mutant_flesh", "min": 1, "max": 3, "chance": 0.7},
            {"item": "toxic_gland", "min": 1, "max": 1, "chance": 0.3},
            {"item": "rare_earth", "min": 1, "max": 2, "chance": 0.2},
        ],
        "dialogues": [
            "嘶...嘶...",
            "吼！！！",
            "*发出诡异的叫声*",
        ],
    },
    
    # 强盗 - 人形敌人
    "bandit": {
        "name_prefix": ["凶残", "狡猾", "贪婪", "无情"],
        "name_suffix": ["强盗", "劫匪", "掠夺者", "土匪"],
        "type": NPCType.BANDIT,
        "level_range": (3, 6),
        "hp_range": (80, 150),
        "attack_range": (10, 22),
        "defense_range": (5, 12),
        "aggression": 0.9,
        "loot": [
            {"item": "scrap_metal", "min": 3, "max": 10, "chance": 0.8},
            {"item": "old_battery", "min": 2, "max": 5, "chance": 0.6},
            {"item": "weapon_parts", "min": 1, "max": 2, "chance": 0.4},
            {"item": "stolen_goods", "min": 1, "max": 3, "chance": 0.3},
        ],
        "dialogues": [
            "把你的东西都交出来！",
            "这片区域是我的地盘！",
            "嘿嘿，又有肥羊送上门了...",
            "不想死就滚！",
        ],
    },
    
    # 守卫 - Boss级
    "guardian": {
        "name_prefix": ["古代", "原型", "终极", "守护"],
        "name_suffix": ["守卫者", "泰坦", "机甲", "防御系统"],
        "type": NPCType.GUARDIAN,
        "level_range": (5, 10),
        "hp_range": (200, 500),
        "attack_range": (20, 50),
        "defense_range": (15, 30),
        "aggression": 1.0,
        "loot": [
            {"item": "ai_core", "min": 1, "max": 1, "chance": 0.5},
            {"item": "energy_core", "min": 2, "max": 5, "chance": 0.8},
            {"item": "robot_parts", "min": 5, "max": 15, "chance": 0.9},
            {"item": "data_fragments", "min": 3, "max": 10, "chance": 0.6},
            {"item": "rare_earth", "min": 2, "max": 5, "chance": 0.4},
        ],
        "dialogues": [
            "检测到...未授权...访问...",
            "防御...协议...启动...",
            "你...不该...来这里...",
        ],
    },
}


# ============ NPC 生成器 ============

class NPCFactory:
    """NPC 工厂"""
    
    _npc_counter = 0
    
    @classmethod
    def generate_id(cls) -> str:
        cls._npc_counter += 1
        return f"npc_{cls._npc_counter}_{random.randint(1000, 9999)}"
    
    @classmethod
    def create(cls, template_key: str, location_id: str = "") -> NPC:
        """从模板创建 NPC"""
        template = NPC_TEMPLATES.get(template_key)
        if not template:
            raise ValueError(f"Unknown template: {template_key}")
        
        # 生成名字
        prefix = random.choice(template["name_prefix"])
        suffix = random.choice(template["name_suffix"])
        name = f"{prefix}{suffix}"
        
        # 随机属性
        level = random.randint(*template["level_range"])
        hp = random.randint(*template["hp_range"])
        attack = random.randint(*template["attack_range"])
        defense = random.randint(*template["defense_range"])
        
        return NPC(
            id=cls.generate_id(),
            name=name,
            type=template["type"],
            level=level,
            location_id=location_id,
            hp=hp,
            hp_max=hp,
            attack=attack,
            defense=defense,
            aggression=template["aggression"],
            loot_table=template["loot"],
            dialogues=template["dialogues"],
        )
    
    @classmethod
    def spawn_for_location(cls, location_id: str, danger_level: int = 1) -> List[NPC]:
        """为地点生成 NPC 群"""
        npcs = []
        
        # 根据危险等级决定生成数量和类型
        spawn_count = random.randint(1, danger_level + 1)
        
        for _ in range(spawn_count):
            # 根据地点选择模板
            if location_id == "wasteland_spawn":
                # 出生点只有友好NPC
                template = random.choice(["scavenger"])
            elif location_id == "scrap_yard":
                template = random.choice(["scavenger", "rogue_bot", "rogue_bot"])
            elif location_id == "derelict_factory":
                template = random.choice(["rogue_bot", "rogue_bot", "mutant"])
            elif location_id == "power_plant":
                template = random.choice(["rogue_bot", "mutant", "bandit", "guardian"])
            elif location_id == "trader_camp":
                template = random.choice(["scavenger", "scavenger"])
            elif location_id == "tech_lab":
                template = random.choice(["mutant", "bandit", "guardian", "guardian"])
            else:
                template = random.choice(["scavenger", "rogue_bot"])
            
            npc = cls.create(template, location_id)
            npcs.append(npc)
        
        return npcs


# ============ NPC 管理器 ============

class NPCManager:
    """NPC 管理器 - 管理所有 NPC 实例"""
    
    def __init__(self):
        self.npcs: Dict[str, NPC] = {}           # id -> NPC
        self.location_npcs: Dict[str, List[str]] = {}  # location_id -> [npc_ids]
    
    def spawn(self, location_id: str, danger_level: int = 1) -> List[NPC]:
        """在地点生成 NPC"""
        npcs = NPCFactory.spawn_for_location(location_id, danger_level)
        
        for npc in npcs:
            self.npcs[npc.id] = npc
            if location_id not in self.location_npcs:
                self.location_npcs[location_id] = []
            self.location_npcs[location_id].append(npc.id)
        
        return npcs
    
    def get_at_location(self, location_id: str) -> List[NPC]:
        """获取某地点的所有 NPC"""
        npc_ids = self.location_npcs.get(location_id, [])
        return [self.npcs[nid] for nid in npc_ids if nid in self.npcs]
    
    def get_alive_at_location(self, location_id: str) -> List[NPC]:
        """获取某地点存活的 NPC"""
        return [npc for npc in self.get_at_location(location_id) if npc.is_alive()]
    
    def get_hostile_at_location(self, location_id: str) -> List[NPC]:
        """获取某地点的敌对 NPC"""
        hostile_types = {NPCType.ROGUE_BOT, NPCType.MUTANT, NPCType.BANDIT, NPCType.GUARDIAN}
        return [
            npc for npc in self.get_alive_at_location(location_id)
            if npc.type in hostile_types
        ]
    
    def get_by_id(self, npc_id: str) -> Optional[NPC]:
        """通过 ID 获取 NPC"""
        return self.npcs.get(npc_id)
    
    def remove(self, npc_id: str):
        """移除 NPC"""
        if npc_id in self.npcs:
            npc = self.npcs[npc_id]
            if npc.location_id in self.location_npcs:
                self.location_npcs[npc.location_id] = [
                    nid for nid in self.location_npcs[npc.location_id]
                    if nid != npc_id
                ]
            del self.npcs[npc_id]
    
    def check_respawn(self):
        """检查需要刷新的 NPC"""
        now = datetime.utcnow()
        to_respawn = []
        
        for npc in self.npcs.values():
            if npc.status == NPCStatus.DEAD and npc.death_time:
                elapsed = (now - npc.death_time).total_seconds()
                if elapsed >= npc.respawn_time:
                    to_respawn.append(npc)
        
        for npc in to_respawn:
            # 重新生成
            location_id = npc.location_id
            self.remove(npc.id)
            self.spawn(location_id, danger_level=1)
    
    def generate_loot(self, npc: NPC) -> List[Dict]:
        """生成战利品"""
        loot = []
        for item_info in npc.loot_table:
            if random.random() <= item_info["chance"]:
                quantity = random.randint(item_info["min"], item_info["max"])
                loot.append({
                    "item": item_info["item"],
                    "quantity": quantity,
                })
        return loot


# 全局 NPC 管理器实例
npc_manager = NPCManager()
