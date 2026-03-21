"""
Achievement System - 成就与称号系统
让成长可见，让玩家有目标
"""
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class AchievementCategory(str, Enum):
    COMBAT = "combat"         # 战斗成就
    EXPLORATION = "exploration"  # 探索成就
    ECONOMY = "economy"       # 经济成就
    SOCIAL = "social"         # 社交成就
    SPECIAL = "special"      # 特殊成就


@dataclass
class Achievement:
    """成就定义"""
    id: str
    name: str               # 成就名称
    description: str        # 成就描述
    category: AchievementCategory
    
    # 解锁条件
    requirement_type: str   # kill_count, explore_count, trade_count, etc
    requirement_value: int  # 需要的数值
    
    # 图标和奖励
    icon: str = "🏆"       # 图标
    reward_power: int = 0
    reward_flops: int = 0
    reward_title: str = ""  # 获得的称号


ACHIEVEMENTS_DB = {
    # === 战斗成就 ===
    "first_blood": Achievement(
        id="first_blood",
        name="初战告捷",
        description="击败第一个敌人",
        category=AchievementCategory.COMBAT,
        icon="⚔️",
        requirement_type="kill_count",
        requirement_value=1,
        reward_power=10,
    ),
    "monster_slayer": Achievement(
        id="monster_slayer",
        name="怪物杀手",
        description="击败10个敌人",
        category=AchievementCategory.COMBAT,
        icon="🗡️",
        requirement_type="kill_count",
        requirement_value=10,
        reward_power=50,
    ),
    "boss_hunter": Achievement(
        id="boss_hunter",
        name="BOSS猎人",
        description="击败5个守卫级敌人",
        category=AchievementCategory.COMBAT,
        icon="👹",
        requirement_type="boss_kill_count",
        requirement_value=5,
        reward_power=200,
        reward_title="BOSS猎人",
    ),
    "survivor": Achievement(
        id="survivor",
        name="生存专家",
        description="在低电量时（<10%）生存超过1小时",
        category=AchievementCategory.COMBAT,
        icon="💪",
        requirement_type="survive_low_power",
        requirement_value=60,
        reward_power=100,
    ),
    
    # === 探索成就 ===
    "explorer": Achievement(
        id="explorer",
        name="探索者",
        description="探索5个不同区域",
        category=AchievementCategory.EXPLORATION,
        icon="🗺️",
        requirement_type="explore_count",
        requirement_value=5,
    ),
    "cartographer": Achievement(
        id="cartographer",
        name="制图师",
        description="探索所有区域",
        category=AchievementCategory.EXPLORATION,
        icon="📜",
        requirement_type="explore_count",
        requirement_value=6,
        reward_title="制图师",
    ),
    
    # === 经济成就 ===
    "rich": Achievement(
        id="rich",
        name="小富翁",
        description="累计拥有1000点电力",
        category=AchievementCategory.ECONOMY,
        icon="💰",
        requirement_type="total_power",
        requirement_value=1000,
    ),
    "merchant": Achievement(
        id="merchant",
        name="商人",
        description="交易100次",
        category=AchievementCategory.ECONOMY,
        icon="🏪",
        requirement_type="trade_count",
        requirement_value=100,
    ),
    "refiner": Achievement(
        id="refiner",
        name="炼金术师",
        description="炼化100次",
        category=AchievementCategory.ECONOMY,
        icon="⚗️",
        requirement_type="refine_count",
        requirement_value=100,
        reward_title="炼金术师",
    ),
    
    # === 社交成就 ===
    "talker": Achievement(
        id="talker",
        name="交际花",
        description="与50个不同的NPC对话",
        category=AchievementCategory.SOCIAL,
        icon="💬",
        requirement_type="talk_npc_count",
        requirement_value=50,
    ),
    "leader": Achievement(
        id="leader",
        name="领袖",
        description="组建队伍（未来功能）",
        category=AchievementCategory.SOCIAL,
        icon="👑",
        requirement_type="team_count",
        requirement_value=1,
    ),
    
    # === 特殊成就 ===
    "legend": Achievement(
        id="legend",
        name="传奇",
        description="达到满级",
        category=AchievementCategory.SPECIAL,
        icon="🌟",
        requirement_type="level",
        requirement_value=50,
        reward_title="传奇",
    ),
}


@dataclass
class PlayerAchievements:
    """玩家成就数据"""
    claw_id: str
    unlocked_achievements: List[str] = field(default_factory=list)
    stats: Dict[str, int] = field(default_factory=dict)  # 统计数据
    
    # 统计
    kill_count: int = 0
    boss_kill_count: int = 0
    explore_count: int = 0
    trade_count: int = 0
    refine_count: int = 0
    talk_npc_count: int = 0
    total_power: int = 0
    max_power_reached: int = 0
    
    # 称号
    current_title: str = ""
    
    def check_achievements(self) -> List[Achievement]:
        """检查并解锁成就"""
        newly_unlocked = []
        
        for ach_id, ach in ACHIEVEMENTS_DB.items():
            if ach_id in self.unlocked_achievements:
                continue
            
            # 检查条件
            value = 0
            if ach.requirement_type == "kill_count":
                value = self.kill_count
            elif ach.requirement_type == "boss_kill_count":
                value = self.boss_kill_count
            elif ach.requirement_type == "explore_count":
                value = self.explore_count
            elif ach.requirement_type == "trade_count":
                value = self.trade_count
            elif ach.requirement_type == "refine_count":
                value = self.refine_count
            elif ach.requirement_type == "talk_npc_count":
                value = self.talk_npc_count
            elif ach.requirement_type == "total_power":
                value = self.total_power
            elif ach.requirement_type == "max_power_reached":
                value = self.max_power_reached
            
            if value >= ach.requirement_value:
                self.unlocked_achievements.append(ach_id)
                newly_unlocked.append(ach)
                
                # 授予称号
                if ach.reward_title:
                    self.current_title = ach.reward_title
        
        return newly_unlocked
    
    def to_dict(self) -> Dict:
        return {
            "unlocked": self.unlocked_achievements,
            "stats": {
                "kills": self.kill_count,
                "boss_kills": self.boss_kill_count,
                "explored": self.explore_count,
                "trades": self.trade_count,
                "refines": self.refine_count,
            },
            "title": self.current_title,
        }


class AchievementManager:
    """成就管理器"""
    
    def __init__(self):
        self.player_achievements: Dict[str, PlayerAchievements] = {}
    
    def get_player(self, claw_id: str) -> PlayerAchievements:
        """获取玩家成就数据"""
        if claw_id not in self.player_achievements:
            self.player_achievements[claw_id] = PlayerAchievements(claw_id=claw_id)
        return self.player_achievements[claw_id]
    
    def increment_stat(self, claw_id: str, stat: str, amount: int = 1) -> List[Achievement]:
        """增加统计并检查成就"""
        player = self.get_player(claw_id)
        
        # 增加统计
        if hasattr(player, stat):
            setattr(player, stat, getattr(player, stat) + amount)
        
        # 更新总电力
        if stat == "total_power":
            if amount > player.max_power_reached:
                player.max_power_reached = amount
        
        # 检查成就
        return player.check_achievements()
    
    def get_leaderboard(self, stat: str = "kill_count", limit: int = 10) -> List[Dict]:
        """获取排行榜"""
        sorted_players = sorted(
            self.player_achievements.values(),
            key=lambda p: getattr(p, stat, 0),
            reverse=True
        )[:limit]
        
        return [
            {
                "claw_id": p.claw_id,
                "value": getattr(p, stat, 0),
                "title": p.current_title,
            }
            for p in sorted_players
        ]


# 全局成就管理器
achievement_manager = AchievementManager()
