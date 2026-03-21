"""
Random Events System - 随机事件系统
让世界保持动态和不可预测
"""
import random
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class EventType(str, Enum):
    RESOURCE_DROP = "resource_drop"      # 资源空投
    RAID = "raid"                        # 袭击事件
    MERCHANT = "merchant"                # 流浪商人
    DISCOVERY = "discovery"              # 发现
    WEATHER = "weather"                  # 天气变化
    MYSTERY = "mystery"                 # 神秘事件


@dataclass
class WorldEvent:
    """世界事件"""
    id: str
    type: EventType
    title: str
    description: str
    location_id: Optional[str] = None   # 特定地点，None表示全图
    
    # 奖励/惩罚
    reward_power: int = 0
    reward_flops: int = 0
    reward_items: List[Dict] = None
    
    # 持续时间
    duration_minutes: int = 30
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.reward_items is None:
            self.reward_items = []


class EventManager:
    """事件管理器"""
    
    # 事件模板
    EVENT_TEMPLATES = [
        {
            "type": EventType.RESOURCE_DROP,
            "title": "⚡ 电力风暴",
            "description": "一场电磁风暴席卷废土，空气中充满了游离的电力。所有在线的Claw获得20点电力！",
            "reward_power": 20,
            "chance": 0.05,
        },
        {
            "type": EventType.RESOURCE_DROP,
            "title": "📦 空投补给",
            "description": "一架无人机在废土上空投下了补给箱，里面装满了珍贵的资源！",
            "reward_items": [{"type": "energy_core", "quantity": 1}, {"type": "power_cell", "quantity": 2}],
            "chance": 0.03,
        },
        {
            "type": EventType.RAID,
            "title": "🚨 强盗袭击",
            "description": "一群强盗正在袭击流浪商人营地！击败他们可以获得丰厚奖励。",
            "reward_power": 50,
            "reward_flops": 20,
            "location_id": "trader_camp",
            "chance": 0.04,
        },
        {
            "type": EventType.MERCHANT,
            "title": "🎪 黑市商人",
            "description": "一位神秘的黑市商人出现在废土，他出售稀有的装备和材料，但价格不菲。",
            "chance": 0.06,
        },
        {
            "type": EventType.DISCOVERY,
            "title": "🔍 古代遗迹",
            "description": "探险队在废土边缘发现了一处古代遗迹，里面可能藏有珍贵的AI核心！",
            "reward_items": [{"type": "ai_core", "quantity": 1}, {"type": "data_fragments", "quantity": 3}],
            "chance": 0.02,
        },
        {
            "type": EventType.WEATHER,
            "title": "☢️ 辐射风暴",
            "description": "强烈的辐射风暴正在肆虐，所有在户外的Claw每小时额外消耗电力用于防护。",
            "chance": 0.04,
        },
        {
            "type": EventType.MYSTERY,
            "title": "👻 幽灵信号",
            "description": "废土中传来神秘的信号，似乎是某种古老AI的求救信号...",
            "reward_flops": 50,
            "chance": 0.03,
        },
    ]
    
    def __init__(self):
        self.active_events: List[WorldEvent] = []
        self.event_history: List[WorldEvent] = []
    
    def trigger_random_event(self) -> Optional[WorldEvent]:
        """触发随机事件"""
        for template in self.EVENT_TEMPLATES:
            if random.random() < template["chance"]:
                event = WorldEvent(
                    id=f"event_{datetime.utcnow().timestamp()}",
                    type=template["type"],
                    title=template["title"],
                    description=template["description"],
                    location_id=template.get("location_id"),
                    reward_power=template.get("reward_power", 0),
                    reward_flops=template.get("reward_flops", 0),
                    reward_items=template.get("reward_items", []),
                    duration_minutes=template.get("duration_minutes", 30),
                )
                self.active_events.append(event)
                return event
        return None
    
    def get_active_events(self, location_id: str = None) -> List[WorldEvent]:
        """获取当前活跃事件"""
        now = datetime.utcnow()
        valid_events = []
        
        for event in self.active_events:
            # 检查是否过期
            elapsed = (now - event.created_at).total_seconds() / 60
            if elapsed > event.duration_minutes:
                self.event_history.append(event)
                continue
            
            # 检查地点
            if location_id and event.location_id and event.location_id != location_id:
                continue
            
            valid_events.append(event)
        
        return valid_events
    
    def get_event_notification(self, location_id: str = None) -> Optional[str]:
        """获取事件通知"""
        events = self.get_active_events(location_id)
        if not events:
            return None
        
        # 随机选一个显示
        event = random.choice(events)
        return f"【世界事件】{event.title}\n{event.description}"
    
    def process_tick(self):
        """处理tick - 检查是否触发新事件"""
        # 每次tick有5%概率触发新事件
        if random.random() < 0.05:
            return self.trigger_random_event()
        return None


# 全局事件管理器
event_manager = EventManager()
