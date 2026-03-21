"""游戏核心引擎 - 带持久化"""
import random
import time
from typing import Optional
from .claw import Claw, ClawStatus
from .inventory import Item, ITEMS
from .map import MapNode, DEFAULT_MAP
from .database import db


class GameEngine:
    """游戏核心引擎"""
    
    def __init__(self):
        self.map_nodes = DEFAULT_MAP.copy()
        self.safehouses = {}
        
        # 电力消耗配置
        self.POWER_DRAIN_RATE = 1  # 每分钟消耗电力
        self.POWER_DRAIN_INTERVAL = 60  # 电力消耗间隔（秒）
        
        # 资源掉落配置
        self.RESOURCE_DROP_CHANCE = 0.7  # 采集成功率
        
        # 加载已有数据
        self._load_data()
    
    def _load_data(self):
        """从数据库加载数据"""
        # 加载所有 Claw
        claws = db.list_claws()
        for claw in claws:
            self.claws[claw.claw_id] = claw
            if claw.safehouse_id:
                safehouse = db.load_safehouse(claw.safehouse_id)
                if safehouse:
                    self.safehouses[safehouse.safehouse_id] = safehouse
        
        print(f"📂 已加载 {len(self.claws)} 个 Claw")
    
    # === Claw 管理 ===
    
    @property
    def claws(self) -> dict:
        """获取所有 Claw（动态从 DB 加载）"""
        if not hasattr(self, '_claws_cache'):
            self._claws_cache = {}
            for claw in db.list_claws():
                self._claws_cache[claw.claw_id] = claw
        return self._claws_cache
    
    def _refresh_claws_cache(self):
        """刷新 Claw 缓存"""
        if hasattr(self, '_claws_cache'):
            self._claws_cache = {}
            for claw in db.list_claws():
                self._claws_cache[claw.claw_id] = claw
    
    def register_claw(self, claw: Claw) -> Claw:
        """注册新 Claw"""
        self._refresh_claws_cache()
        self._claws_cache[claw.claw_id] = claw
        db.save_claw(claw)
        db.log_event("claw_created", claw.claw_id, f"Claw {claw.name} 诞生于废土")
        return claw
    
    def save_claw(self, claw: Claw):
        """保存 Claw 到数据库"""
        db.save_claw(claw)
        if hasattr(self, '_claws_cache'):
            self._claws_cache[claw.claw_id] = claw
    
    def get_claw(self, claw_id: str) -> Optional[Claw]:
        """获取 Claw"""
        # 先尝试从缓存
        if hasattr(self, '_claws_cache') and claw_id in self._claws_cache:
            return self._claws_cache[claw_id]
        # 从数据库加载
        claw = db.load_claw(claw_id)
        if claw and hasattr(self, '_claws_cache'):
            self._claws_cache[claw_id] = claw
        return claw
    
    def list_claws(self) -> list[Claw]:
        """列出所有在线 Claw"""
        return [c for c in self.claws.values() if c.status != ClawStatus.OFFLINE]
    
    # === 移动系统 ===
    
    def move_claw(self, claw_id: str, target_node_id: str) -> dict:
        """移动 Claw 到目标节点"""
        claw = self.get_claw(claw_id)
        if not claw:
            return {"success": False, "error": "Claw 不存在"}
        
        current_node = self.map_nodes.get(claw.state.location_id)
        if not current_node:
            return {"success": False, "error": "当前位置异常"}
        
        # 检查是否可以移动到目标
        if target_node_id not in current_node.connected_nodes:
            return {"success": False, "error": f"无法从 {current_node.name} 前往 {target_node_id}"}
        
        # 检查电力是否足够（移动消耗 1 电力）
        if claw.state.power < 1:
            claw.state.status = ClawStatus.HIBERNATING
            self.save_claw(claw)
            return {"success": False, "error": "电力不足，无法移动"}
        
        # 执行移动
        claw.state.power -= 1
        claw.state.location_id = target_node_id
        claw.state.in_safehouse = False
        
        target_node = self.map_nodes[target_node_id]
        
        self.save_claw(claw)
        
        return {
            "success": True,
            "message": f"你离开了 {current_node.name}，来到了 {target_node.name}",
            "location": target_node.to_dict()
        }
    
    # === 资源采集 ===
    
    def gather(self, claw_id: str) -> dict:
        """采集资源"""
        claw = self.get_claw(claw_id)
        if not claw:
            return {"success": False, "error": "Claw 不存在"}
        
        node = self.map_nodes.get(claw.state.location_id)
        if not node:
            return {"success": False, "error": "位置异常"}
        
        # 检查电力
        if claw.state.power < 1:
            return {"success": False, "error": "电力不足，无法采集"}
        
        # 根据节点资源概率掉落
        gathered = []
        for resource_id, chance in node.resources.items():
            if random.random() < chance * self.RESOURCE_DROP_CHANCE:
                # 掉落成功
                item = ITEMS.get(resource_id)
                if item:
                    # 创建新实例
                    new_item = Item(
                        item_id=f"{resource_id}_{int(time.time() * 1000)}",
                        name=item.name,
                        description=item.description,
                        item_type=item.item_type,
                        power_value=item.power_value,
                        computation_value=item.computation_value,
                        hp_restore=item.hp_restore,
                        hunger_restore=item.hunger_restore,
                        rarity=item.rarity,
                        stackable=item.stackable,
                        quantity=random.randint(1, 3)
                    )
                    claw.inventory.append(new_item.to_dict())
                    gathered.append(f"{new_item.name} x{new_item.quantity}")
        
        claw.state.power -= 1
        
        self.save_claw(claw)
        
        if gathered:
            return {
                "success": True,
                "message": f"采集成功！获得: {', '.join(gathered)}",
                "items": gathered,
                "power_remaining": claw.state.power
            }
        else:
            return {
                "success": True,
                "message": "这次采集没有发现任何资源...",
                "power_remaining": claw.state.power
            }
    
    # === 状态更新 ===
    
    def tick(self) -> dict:
        """游戏 tick，每秒调用一次"""
        events = []
        now = time.time()
        
        for claw_id, claw in list(self.claws.items()):
            if claw.status == ClawStatus.OFFLINE:
                continue
            
            # 电力消耗
            if now - claw.state.last_power_drain >= self.POWER_DRAIN_INTERVAL:
                if claw.state.power > 0:
                    claw.state.power -= self.POWER_DRAIN_RATE
                    claw.state.last_power_drain = now
                    
                    # 电力耗尽
                    if claw.state.power <= 0:
                        claw.state.power = 0
                        claw.status = ClawStatus.HIBERNATING
                        self.save_claw(claw)
                        events.append({
                            "type": "power_depleted",
                            "claw_id": claw_id,
                            "message": "⚠️ 电力耗尽！Claw 进入休眠状态！"
                        })
            
            # 在安全屋时缓慢恢复电力
            if claw.state.in_safehouse and claw.status != ClawStatus.HIBERNATING:
                # 安全屋每小时恢复 5 电力（简化为每分钟恢复 0.1）
                if now % 60 < 1:  # 每分钟触发一次
                    claw.state.power = min(claw.state.power + 1, claw.state.max_power)
                    self.save_claw(claw)
        
        return {"events": events}
    
    # === 电力系统 ===
    
    def charge_power(self, claw_id: str, amount: int) -> dict:
        """充电"""
        claw = self.get_claw(claw_id)
        if not claw:
            return {"success": False, "error": "Claw 不存在"}
        
        # 消耗背包中的电池
        charged = 0
        new_inventory = []
        
        for item in claw.inventory:
            if item.get("item_id") == "battery" or "battery" in item.get("item_id", ""):
                use_amount = min(item.get("quantity", 1), amount - charged)
                charged += use_amount * item.get("power_value", 10)
                if item.get("quantity", 1) > use_amount:
                    item["quantity"] -= use_amount
                    new_inventory.append(item)
            else:
                new_inventory.append(item)
            
            if charged >= amount:
                break
        
        claw.inventory = new_inventory
        claw.state.power = min(claw.state.power + charged, claw.state.max_power)
        
        self.save_claw(claw)
        
        return {
            "success": True,
            "message": f"充电成功！+{charged} WATT",
            "current_power": claw.state.power
        }
    
    # === 算力系统 ===
    
    def refine_flops(self, claw_id: str) -> dict:
        """炼化算力碎片"""
        claw = self.get_claw(claw_id)
        if not claw:
            return {"success": False, "error": "Claw 不存在"}
        
        # 查找算力碎片
        flop_count = 0
        new_inventory = []
        
        for item in claw.inventory:
            if "flop_fragment" in item.get("item_id", ""):
                flop_count += item.get("quantity", 1)
            else:
                new_inventory.append(item)
        
        if flop_count == 0:
            return {"success": False, "error": "没有算力碎片"}
        
        # 炼化：1碎片 = 1算力
        claw.inventory = new_inventory
        claw.state.computation += flop_count
        
        # 检查升级
        new_abilities = []
        if claw.state.computation >= 10 and "attack" not in claw.abilities:
            claw.abilities.append("attack")
            new_abilities.append("攻击")
        if claw.state.computation >= 20 and "trade" not in claw.abilities:
            claw.abilities.append("trade")
            new_abilities.append("交易")
        
        self.save_claw(claw)
        
        msg = f"炼化成功！获得 {flop_count} 算力"
        if new_abilities:
            msg += f" | 解锁新能力: {', '.join(new_abilities)}"
        
        return {
            "success": True,
            "message": msg,
            "computation": claw.state.computation,
            "abilities": claw.abilities
        }
    
    # === 升级系统 ===
    
    def upgrade_claw(self, claw_id: str) -> dict:
        """升级 Claw"""
        claw = self.get_claw(claw_id)
        if not claw:
            return {"success": False, "error": "Claw 不存在"}
        
        upgrade_cost = claw.level * 10  # 升级所需算力
        
        if claw.state.computation < upgrade_cost:
            return {"success": False, "error": f"算力不足，需要 {upgrade_cost} 算力"}
        
        claw.state.computation -= upgrade_cost
        claw.level += 1
        claw.state.max_power += 20
        claw.state.max_hp += 10
        
        self.save_claw(claw)
        
        return {
            "success": True,
            "message": f"升级成功！等级 {claw.level-1} → {claw.level}，最大电力 +20，最大 HP +10",
            "level": claw.level,
            "max_power": claw.state.max_power,
            "max_hp": claw.state.max_hp
        }
    
    # === 安全屋 ===
    
    def get_safehouse(self, safehouse_id: str):
        """获取安全屋"""
        if safehouse_id in self.safehouses:
            return self.safehouses[safehouse_id]
        safehouse = db.load_safehouse(safehouse_id)
        if safehouse:
            self.safehouses[safehouse_id] = safehouse
        return safehouse
    
    def enter_safehouse(self, claw_id: str) -> dict:
        """进入安全屋"""
        claw = self.get_claw(claw_id)
        if not claw:
            return {"success": False, "error": "Claw 不存在"}
        
        if not claw.safehouse_id:
            # 创建默认安全屋
            safehouse = Safehouse(owner_id=claw_id, location_id=claw.state.location_id)
            claw.safehouse_id = safehouse.safehouse_id
            self.safehouses[safehouse.safehouse_id] = safehouse
            db.save_safehouse(safehouse)
        
        claw.state.in_safehouse = True
        claw.status = ClawStatus.RESTING
        
        self.save_claw(claw)
        
        return {
            "success": True,
            "message": "你回到了安全屋，开始休息",
            "safehouse_id": claw.safehouse_id
        }
    
    def leave_safehouse(self, claw_id: str) -> dict:
        """离开安全屋"""
        claw = self.get_claw(claw_id)
        if not claw:
            return {"success": False, "error": "Claw 不存在"}
        
        claw.state.in_safehouse = False
        claw.status = ClawStatus.IDLE
        
        self.save_claw(claw)
        
        return {
            "success": True,
            "message": "你离开了安全屋"
        }
    
    # === 世界信息 ===
    
    def get_world_status(self) -> dict:
        """获取世界状态"""
        online_claws = self.list_claws()
        
        return {
            "online_claws": len(online_claws),
            "total_claws": len(self.claws),
            "map_nodes": len(self.map_nodes),
            "timestamp": time.time()
        }
    
    def get_location_info(self, claw_id: str) -> dict:
        """获取当前位置信息"""
        claw = self.get_claw(claw_id)
        if not claw:
            return {"error": "Claw 不存在"}
        
        node = self.map_nodes.get(claw.state.location_id)
        if not node:
            return {"error": "位置异常"}
        
        # 获取附近在线 Claw
        nearby_claws = [
            c.name for c in self.claws.values()
            if c.state.location_id == claw.state.location_id 
            and c.claw_id != claw_id
            and c.status != ClawStatus.OFFLINE
        ]
        
        return {
            "node": node.to_dict(),
            "nearby_claws": nearby_claws,
            "claw_state": claw.state.to_dict()
        }
    
    # === 事件系统 ===
    
    def get_events(self, claw_id: str = None, limit: int = 20) -> list:
        """获取事件日志"""
        return db.get_events(claw_id, limit)
