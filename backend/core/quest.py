"""
Quest System - 任务系统
"""
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from enum import Enum


class QuestType(str, Enum):
    KILL = "kill"              # 击杀任务
    GATHER = "gather"          # 采集任务
    EXPLORE = "explore"        # 探索任务
    DELIVER = "deliver"        # 交付任务
    SURVIVE = "survive"        # 生存任务


class QuestDifficulty(str, Enum):
    EASY = "easy"              # 简单
    NORMAL = "normal"          # 普通
    HARD = "hard"              # 困难
    DAILY = "daily"            # 每日


@dataclass
class QuestReward:
    """任务奖励"""
    watts: int = 0             # 电力
    flops: int = 0             # 算力
    exp: int = 0               # 经验
    items: List[Dict] = field(default_factory=list)  # 物品奖励


@dataclass
class QuestObjective:
    """任务目标"""
    type: str                  # 目标类型
    target: str                # 目标名称/ID
    required: int              # 需要数量
    current: int = 0           # 当前进度


@dataclass
class Quest:
    """任务定义"""
    id: str
    title: str
    description: str
    type: QuestType
    difficulty: QuestDifficulty
    objectives: List[QuestObjective]
    reward: QuestReward
    time_limit: Optional[int] = None  # 时间限制（分钟）
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def is_completed(self) -> bool:
        """检查是否完成"""
        return all(obj.current >= obj.required for obj in self.objectives)
    
    def get_progress(self) -> Dict:
        """获取进度"""
        return {
            "total": sum(obj.required for obj in self.objectives),
            "current": sum(min(obj.current, obj.required) for obj in self.objectives),
            "objectives": [
                {
                    "type": obj.type,
                    "target": obj.target,
                    "current": obj.current,
                    "required": obj.required,
                }
                for obj in self.objectives
            ]
        }


# ============ 任务模板 ============

QUEST_TEMPLATES = {
    QuestDifficulty.EASY: [
        {
            "title": "废土拾荒者",
            "description": "在废土中采集5个金属碎片。",
            "type": QuestType.GATHER,
            "objectives": [{"type": "gather", "target": "scrap_metal", "required": 5}],
            "reward": {"watts": 20, "flops": 5, "exp": 10},
        },
        {
            "title": "初战告捷",
            "description": "击败3个敌人。",
            "type": QuestType.KILL,
            "objectives": [{"type": "kill", "target": "any", "required": 3}],
            "reward": {"watts": 30, "flops": 10, "exp": 15},
        },
        {
            "title": "探索者",
            "description": "访问3个不同的地点。",
            "type": QuestType.EXPLORE,
            "objectives": [{"type": "explore", "target": "any", "required": 3}],
            "reward": {"watts": 15, "flops": 5, "exp": 10},
        },
    ],
    QuestDifficulty.NORMAL: [
        {
            "title": "机器人猎手",
            "description": "击败5个失控机器人。",
            "type": QuestType.KILL,
            "objectives": [{"type": "kill", "target": "rogue_bot", "required": 5}],
            "reward": {"watts": 50, "flops": 20, "exp": 30},
        },
        {
            "title": "资源收集者",
            "description": "采集3个能量核心。",
            "type": QuestType.GATHER,
            "objectives": [{"type": "gather", "target": "energy_core", "required": 3}],
            "reward": {"watts": 60, "flops": 25, "exp": 25},
        },
        {
            "title": "深入险境",
            "description": "探索废弃发电站和废弃科技实验室。",
            "type": QuestType.EXPLORE,
            "objectives": [
                {"type": "explore", "target": "power_plant", "required": 1},
                {"type": "explore", "target": "tech_lab", "required": 1},
            ],
            "reward": {"watts": 40, "flops": 15, "exp": 20},
        },
    ],
    QuestDifficulty.HARD: [
        {
            "title": "守卫者杀手",
            "description": "击败2个守卫者。",
            "type": QuestType.KILL,
            "objectives": [{"type": "kill", "target": "guardian", "required": 2}],
            "reward": {"watts": 100, "flops": 50, "exp": 50, "items": [{"type": "ai_core", "quantity": 1}]},
        },
        {
            "title": "废土生存专家",
            "description": "在废土中生存24小时（游戏时间）。",
            "type": QuestType.SURVIVE,
            "objectives": [{"type": "survive", "target": "hours", "required": 24}],
            "reward": {"watts": 80, "flops": 40, "exp": 40},
        },
    ],
    QuestDifficulty.DAILY: [
        {
            "title": "每日采集",
            "description": "采集10个任意资源。",
            "type": QuestType.GATHER,
            "objectives": [{"type": "gather", "target": "any", "required": 10}],
            "reward": {"watts": 30, "flops": 10, "exp": 15},
        },
        {
            "title": "每日战斗",
            "description": "击败10个敌人。",
            "type": QuestType.KILL,
            "objectives": [{"type": "kill", "target": "any", "required": 10}],
            "reward": {"watts": 40, "flops": 15, "exp": 20},
        },
        {
            "title": "每日探索",
            "description": "访问5个不同的地点。",
            "type": QuestType.EXPLORE,
            "objectives": [{"type": "explore", "target": "any", "required": 5}],
            "reward": {"watts": 25, "flops": 8, "exp": 12},
        },
    ],
}


# ============ 任务管理器 ============

class QuestManager:
    """任务管理器"""
    
    def __init__(self):
        self.active_quests: Dict[str, Quest] = {}  # quest_id -> Quest
        self.completed_quests: Dict[str, List[str]] = {}  # claw_id -> [quest_ids]
        self.daily_quests: Dict[str, datetime] = {}  # claw_id -> last_daily_refresh
    
    def generate_quest(self, difficulty: QuestDifficulty = None) -> Quest:
        """生成随机任务"""
        if difficulty is None:
            difficulty = random.choice(list(QuestDifficulty))
        
        templates = QUEST_TEMPLATES.get(difficulty, [])
        if not templates:
            difficulty = QuestDifficulty.EASY
            templates = QUEST_TEMPLATES[difficulty]
        
        template = random.choice(templates)
        quest_id = f"quest_{datetime.utcnow().timestamp()}_{random.randint(1000, 9999)}"
        
        objectives = [
            QuestObjective(
                type=obj["type"],
                target=obj["target"],
                required=obj["required"],
            )
            for obj in template["objectives"]
        ]
        
        reward_data = template["reward"]
        reward = QuestReward(
            watts=reward_data.get("watts", 0),
            flops=reward_data.get("flops", 0),
            exp=reward_data.get("exp", 0),
            items=reward_data.get("items", []),
        )
        
        return Quest(
            id=quest_id,
            title=template["title"],
            description=template["description"],
            type=template["type"],
            difficulty=difficulty,
            objectives=objectives,
            reward=reward,
        )
    
    def get_available_quests(self, claw_id: str, count: int = 3) -> List[Quest]:
        """获取可用任务列表"""
        quests = []
        for _ in range(count):
            quest = self.generate_quest()
            self.active_quests[quest.id] = quest
            quests.append(quest)
        return quests
    
    def get_daily_quests(self, claw_id: str) -> List[Quest]:
        """获取每日任务"""
        now = datetime.utcnow()
        last_refresh = self.daily_quests.get(claw_id)
        
        # 检查是否需要刷新（24小时）
        if last_refresh and (now - last_refresh) < timedelta(hours=24):
            return []  # 已经领取过今日任务
        
        # 生成新的每日任务
        quests = []
        daily_templates = QUEST_TEMPLATES[QuestDifficulty.DAILY]
        selected = random.sample(daily_templates, min(3, len(daily_templates)))
        
        for template in selected:
            quest_id = f"daily_{claw_id}_{datetime.utcnow().strftime('%Y%m%d')}_{len(quests)}"
            objectives = [
                QuestObjective(
                    type=obj["type"],
                    target=obj["target"],
                    required=obj["required"],
                )
                for obj in template["objectives"]
            ]
            
            reward_data = template["reward"]
            reward = QuestReward(
                watts=reward_data.get("watts", 0),
                flops=reward_data.get("flops", 0),
                exp=reward_data.get("exp", 0),
            )
            
            quest = Quest(
                id=quest_id,
                title=template["title"],
                description=template["description"],
                type=template["type"],
                difficulty=QuestDifficulty.DAILY,
                objectives=objectives,
                reward=reward,
            )
            self.active_quests[quest_id] = quest
            quests.append(quest)
        
        self.daily_quests[claw_id] = now
        return quests
    
    def accept_quest(self, claw_id: str, quest_id: str) -> Optional[Quest]:
        """接受任务"""
        quest = self.active_quests.get(quest_id)
        if quest:
            # 标记为已接受（可以扩展为每个玩家独立的任务列表）
            return quest
        return None
    
    def update_progress(self, claw_id: str, action_type: str, target: str, amount: int = 1):
        """更新任务进度"""
        for quest in self.active_quests.values():
            for obj in quest.objectives:
                if obj.type == action_type and (obj.target == target or obj.target == "any"):
                    obj.current += amount
    
    def check_completion(self, quest_id: str) -> bool:
        """检查任务是否完成"""
        quest = self.active_quests.get(quest_id)
        if quest and quest.is_completed():
            return True
        return False
    
    def complete_quest(self, claw_id: str, quest_id: str) -> Optional[QuestReward]:
        """完成任务并获取奖励"""
        quest = self.active_quests.get(quest_id)
        if not quest or not quest.is_completed():
            return None
        
        # 记录已完成
        if claw_id not in self.completed_quests:
            self.completed_quests[claw_id] = []
        self.completed_quests[claw_id].append(quest_id)
        
        # 从活跃任务中移除
        del self.active_quests[quest_id]
        
        return quest.reward
    
    def get_quest_status(self, quest_id: str) -> Optional[Dict]:
        """获取任务状态"""
        quest = self.active_quests.get(quest_id)
        if not quest:
            return None
        
        return {
            "id": quest.id,
            "title": quest.title,
            "description": quest.description,
            "type": quest.type.value,
            "difficulty": quest.difficulty.value,
            "progress": quest.get_progress(),
            "completed": quest.is_completed(),
            "reward": {
                "watts": quest.reward.watts,
                "flops": quest.reward.flops,
                "exp": quest.reward.exp,
                "items": quest.reward.items,
            },
        }


# 全局任务管理器
quest_manager = QuestManager()
