"""
WebSocket MUD 服务器
"""
import json
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import db
from backend.core import game
from backend.core.npc import npc_manager, NPCStatus, NPCType
from backend.core.economy import shop_manager, Refinery, ITEMS_DB
from backend.core.quest import quest_manager
from backend.core.safehouse import safehouse_manager
from backend.core.events import event_manager
from backend.core.achievements import achievement_manager, ACHIEVEMENTS_DB
from backend.world.map import get_location, get_connected_locations, WORLD_MAP


class ConnectionManager:
    """WebSocket 连接管理器"""
    
    def __init__(self):
        # claw_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # 在线的 claw_id 集合
        self.online_claws: Set[str] = set()
    
    async def connect(self, websocket: WebSocket, claw_id: str):
        # 连接已在 endpoint 中 accept，这里只记录
        self.active_connections[claw_id] = websocket
        self.online_claws.add(claw_id)
        logger.info(f"Claw {claw_id} 已连接")
    
    def disconnect(self, claw_id: str):
        self.active_connections.pop(claw_id, None)
        self.online_claws.discard(claw_id)
        logger.info(f"Claw {claw_id} 已断开")
    
    async def send_to(self, claw_id: str, message: dict):
        """发送消息给指定 Claw"""
        ws = self.active_connections.get(claw_id)
        if ws:
            await ws.send_json(message)
    
    async def broadcast(self, message: dict):
        """广播消息给所有在线 Claw"""
        for ws in self.active_connections.values():
            await ws.send_json(message)


manager = ConnectionManager()


# ==================== MUD 命令处理器 ====================

async def handle_command(claw_id: str, command: str, args: list, db_session: AsyncSession) -> dict:
    """处理 MUD 命令"""
    
    # 获取或创建角色
    claw = await game.get_claw(db_session, claw_id)
    if not claw:
        claw = await game.create_claw(db_session, claw_id, f"Claw-{claw_id[:8]}")
    
    try:
        # ========== 基础命令 ==========
        if command == "look":
            loc = get_location(claw.location_id)
            if not loc:
                return {"error": "你迷失在虚空中..."}
            
            connected = get_connected_locations(claw.location_id)
            exits = [f"- {l.name} (go {l.id})" for l in connected]
            
            # 获取该地点的 NPC
            npcs = npc_manager.get_alive_at_location(claw.location_id)
            npc_info = []
            for npc in npcs:
                status_icon = "⚔️" if npc.type in {NPCType.ROGUE_BOT, NPCType.MUTANT, NPCType.BANDIT, NPCType.GUARDIAN} else "👤"
                npc_info.append({
                    "id": npc.id,
                    "name": npc.name,
                    "type": npc.type.value,
                    "level": npc.level,
                    "hp": npc.hp,
                    "hp_max": npc.hp_max,
                    "icon": status_icon,
                })
            
            return {
                "location": loc.model_dump(),
                "exits": exits,
                "npcs": npc_info,
                "status": {
                    "watts": claw.watts,
                    "flops": claw.flops,
                    "health": claw.health,
                    "hunger": claw.hunger,
                },
            }
        
        elif command == "status":
            return {
                "claw": claw.to_dict(),
            }
        
        elif command == "go":
            if not args:
                return {"error": "去哪里？用法: go <地点ID>"}
            dest = args[0]
            result = await game.move_claw(db_session, claw_id, dest)
            return result
        
        elif command == "gather":
            result = await game.gather_resource(db_session, claw_id)
            return result
        
        elif command == "inventory":
            inventory = claw.inventory or []
            formatted_inventory = []
            for item in inventory:
                item_id = item.get("type", "")
                quantity = item.get("quantity", 0)
                item_info = ITEMS_DB.get(item_id)
                if item_info:
                    formatted_inventory.append({
                        "id": item_id,
                        "name": item_info.name,
                        "quantity": quantity,
                        "category": item_info.category.value,
                    })
                else:
                    formatted_inventory.append({
                        "id": item_id,
                        "name": item_id,
                        "quantity": quantity,
                        "category": "unknown",
                    })
            
            return {
                "inventory": formatted_inventory,
                "watts": claw.watts,
            }
        
        elif command == "help":
            return {
                "commands": [
                    "look - 查看当前位置",
                    "status - 查看角色状态",
                    "go <地点> - 移动到指定地点",
                    "gather - 采集资源",
                    "inventory - 查看背包",
                    "npc - 查看周围NPC",
                    "attack <NPC名> - 攻击NPC",
                    "talk <NPC名> - 与NPC对话",
                    "shop - 查看商店商品",
                    "buy <商品ID> - 购买商品",
                    "sell <物品ID> - 出售物品",
                    "refine <物品ID> <数量> - 炼化物品",
                    "use <物品ID> - 使用消耗品",
                    "equip <装备ID> - 装备物品",
                    "unequip <武器|护甲|饰品> - 卸下装备",
                    "safehouse - 查看安全屋",
                    "safehouse build - 建造安全屋",
                    "safehouse upgrade - 升级安全屋",
                    "safehouse build <设施> - 建造设施",
                    "events - 查看当前事件",
                    "achievements - 查看成就",
                    "leaderboard - 查看排行榜",
                    "quest - 查看可用任务",
                    "quest accept <任务ID> - 接受任务",
                    "quest progress - 查看任务进度",
                    "quest complete <任务ID> - 完成任务",
                    "daily - 领取每日任务",
                    "help - 显示帮助",
                ],
            }
        
        elif command == "quest":
            """任务系统"""
            if not args:
                # 显示可用任务
                quests = quest_manager.get_available_quests(claw_id, count=3)
                if not quests:
                    return {"message": "当前没有可用任务。"}
                
                quest_list = []
                for q in quests:
                    status = quest_manager.get_quest_status(q.id)
                    quest_list.append({
                        "id": q.id,
                        "title": q.title,
                        "difficulty": q.difficulty.value,
                        "description": q.description[:50] + "...",
                        "reward": f"⚡{status['reward']['watts']} 🧠{status['reward']['flops']} 📈{status['reward']['exp']}",
                    })
                
                return {
                    "message": "📜 可用任务（使用 'quest accept <ID>' 接受）:",
                    "quests": quest_list,
                }
            
            subcmd = args[0]
            
            if subcmd == "accept":
                if len(args) < 2:
                    return {"error": "请指定任务ID"}
                quest_id = args[1]
                quest = quest_manager.accept_quest(claw_id, quest_id)
                if quest:
                    return {"message": f"✅ 已接受任务: {quest.title}"}
                return {"error": "任务不存在或无法接受"}
            
            elif subcmd == "progress":
                # 显示当前进行中的任务
                active_quests = [q for q in quest_manager.active_quests.values()]
                if not active_quests:
                    return {"message": "你没有进行中的任务。"}
                
                progress_list = []
                for q in active_quests[:5]:  # 最多显示5个
                    status = quest_manager.get_quest_status(q.id)
                    progress = status["progress"]
                    progress_list.append({
                        "id": q.id[:20] + "...",
                        "title": q.title,
                        "progress": f"{progress['current']}/{progress['total']}",
                        "completed": status["completed"],
                    })
                
                return {
                    "message": "📊 任务进度:",
                    "quests": progress_list,
                }
            
            elif subcmd == "complete":
                if len(args) < 2:
                    return {"error": "请指定任务ID"}
                quest_id = args[1]
                
                # 尝试匹配任务ID（支持前缀匹配）
                matched_quest = None
                for qid in quest_manager.active_quests:
                    if qid.startswith(quest_id) or quest_id in qid:
                        matched_quest = qid
                        break
                
                if not matched_quest:
                    return {"error": "找不到该任务"}
                
                if not quest_manager.check_completion(matched_quest):
                    return {"error": "任务尚未完成"}
                
                reward = quest_manager.complete_quest(claw_id, matched_quest)
                if reward:
                    # 发放奖励
                    claw.watts += reward.watts
                    claw.flops += reward.flops
                    claw.experience += reward.exp
                    
                    # 添加物品奖励
                    if reward.items:
                        inventory = claw.inventory or []
                        for item_reward in reward.items:
                            found = False
                            for inv_item in inventory:
                                if inv_item.get("type") == item_reward["type"]:
                                    inv_item["quantity"] = inv_item.get("quantity", 0) + item_reward["quantity"]
                                    found = True
                                    break
                            if not found:
                                inventory.append({"type": item_reward["type"], "quantity": item_reward["quantity"]})
                        claw.inventory = inventory
                    
                    await db_session.commit()
                    
                    msg = f"🎉 任务完成！获得: ⚡{reward.watts} 🧠{reward.flops} 📈{reward.exp}"
                    if reward.items:
                        items_str = ", ".join(f"{i['type']} x{i['quantity']}" for i in reward.items)
                        msg += f"\n🎁 物品: {items_str}"
                    
                    return {"message": msg}
                
                return {"error": "完成任务失败"}
            
            return {"error": "未知子命令"}
        
        elif command == "daily":
            """领取每日任务"""
            daily_quests = quest_manager.get_daily_quests(claw_id)
            if not daily_quests:
                return {"message": "今日已领取过每日任务，请明天再来。"}
            
            quest_list = []
            for q in daily_quests:
                status = quest_manager.get_quest_status(q.id)
                quest_list.append({
                    "id": q.id[:30] + "...",
                    "title": q.title,
                    "reward": f"⚡{status['reward']['watts']} 🧠{status['reward']['flops']}",
                })
            
            return {
                "message": "📅 今日每日任务已领取！",
                "quests": quest_list,
            }
        
        elif command == "shop":
            """查看商店"""
            shop = shop_manager.get_shop(claw.location_id)
            if not shop:
                return {"error": "这里没有商店"}
            
            items = shop.list_items()
            return {
                "message": f"🛒 商店商品（你有 {claw.watts:.0f} 电力）:",
                "items": items,
            }
        
        elif command == "buy":
            """购买商品"""
            if not args:
                return {"error": "买什么？用法: buy <商品ID>"}
            
            item_id = args[0]
            shop = shop_manager.get_shop(claw.location_id)
            if not shop:
                return {"error": "这里没有商店"}
            
            price = shop.get_price(item_id)
            if claw.watts < price:
                return {"error": f"电力不足，需要 {price} 电力"}
            
            success, msg, item = shop.buy(item_id)
            if success:
                claw.watts -= price
                # 添加到背包
                inventory = claw.inventory or []
                found = False
                for inv_item in inventory:
                    if inv_item.get("type") == item_id:
                        inv_item["quantity"] = inv_item.get("quantity", 0) + 1
                        found = True
                        break
                if not found:
                    inventory.append({"type": item_id, "quantity": 1})
                claw.inventory = inventory
                await db_session.commit()
            
            return {"message": msg} if success else {"error": msg}
        
        elif command == "sell":
            """出售物品"""
            if not args:
                return {"error": "卖什么？用法: sell <物品ID>"}
            
            item_id = args[0]
            shop = shop_manager.get_shop(claw.location_id)
            if not shop:
                return {"error": "这里没有商店"}
            
            # 检查背包
            inventory = claw.inventory or []
            found = False
            for inv_item in inventory:
                if inv_item.get("type") == item_id and inv_item.get("quantity", 0) > 0:
                    found = True
                    inv_item["quantity"] -= 1
                    if inv_item["quantity"] <= 0:
                        inventory.remove(inv_item)
                    break
            
            if not found:
                return {"error": "你没有这个物品"}
            
            success, msg, price = shop.sell(item_id)
            if success:
                claw.watts += price
                claw.inventory = inventory
                await db_session.commit()
                return {"message": f"{msg}，获得 {price} 电力"}
            
            return {"error": msg}
        
        elif command == "refine":
            """炼化物品"""
            if len(args) < 1:
                return {"error": "炼化什么？用法: refine <物品ID> [数量]"}
            
            item_id = args[0]
            quantity = int(args[1]) if len(args) > 1 else 1
            
            # 检查背包
            inventory = claw.inventory or []
            found = False
            for inv_item in inventory:
                if inv_item.get("type") == item_id and inv_item.get("quantity", 0) >= quantity:
                    found = True
                    inv_item["quantity"] -= quantity
                    if inv_item["quantity"] <= 0:
                        inventory.remove(inv_item)
                    break
            
            if not found:
                return {"error": f"你没有足够的 {item_id}"}
            
            # 检查电力
            if claw.watts < Refinery.REFINE_COST * quantity:
                return {"error": f"电力不足，炼化需要 {Refinery.REFINE_COST * quantity} 电力"}
            
            # 执行炼化
            success, msg, output = Refinery.refine(item_id, quantity)
            if success:
                claw.watts -= Refinery.REFINE_COST * quantity
                
                # 应用产出
                if "flop" in output:
                    claw.flops += output["flop"]
                if "power" in output:
                    claw.watts += output["power"]
                
                claw.inventory = inventory
                await db_session.commit()
            
            return {"message": msg} if success else {"error": msg}
        
        elif command == "use":
            """使用消耗品"""
            if not args:
                return {"error": "使用什么？用法: use <物品ID>"}
            
            item_id = args[0]
            item = ITEMS_DB.get(item_id)
            if not item:
                return {"error": "物品不存在"}
            
            if item.category != "consumable":
                return {"error": "这不是消耗品"}
            
            # 检查背包
            inventory = claw.inventory or []
            found = False
            for inv_item in inventory:
                if inv_item.get("type") == item_id and inv_item.get("quantity", 0) > 0:
                    found = True
                    inv_item["quantity"] -= 1
                    if inv_item["quantity"] <= 0:
                        inventory.remove(inv_item)
                    break
            
            if not found:
                return {"error": "你没有这个物品"}
            
            # 应用效果
            messages = []
            if item.power_restore > 0:
                old_power = claw.watts
                claw.watts = min(200, claw.watts + item.power_restore)  # 假设最大200
                messages.append(f"电力 +{claw.watts - old_power:.0f}")
            
            if item.hp_restore > 0:
                old_hp = claw.health
                claw.health = min(claw.max_health, claw.health + item.hp_restore)
                messages.append(f"生命 +{claw.health - old_hp}")
            
            claw.inventory = inventory
            await db_session.commit()
            
            return {"message": f"使用了 {item.name}！{', '.join(messages)}"}
        
        elif command == "equip":
            """装备物品"""
            if not args:
                return {"error": "装备什么？用法: equip <物品ID>"}
            
            item_id = args[0]
            item = ITEMS_DB.get(item_id)
            if not item:
                return {"error": "物品不存在"}
            
            if item.category != "equipment":
                return {"error": "这不是装备"}
            
            if not item.slot:
                return {"error": "此物品无法装备"}
            
            # 检查背包
            inventory = claw.inventory or []
            found = False
            for inv_item in inventory:
                if inv_item.get("type") == item_id and inv_item.get("quantity", 0) > 0:
                    found = True
                    inv_item["quantity"] -= 1
                    if inv_item["quantity"] <= 0:
                        inventory.remove(inv_item)
                    break
            
            if not found:
                return {"error": "你没有这个物品"}
            
            # 卸下当前装备（如果有）
            equipment = claw.equipment or {}
            old_item_id = equipment.get(item.slot.value)
            if old_item_id:
                # 旧装备放回背包
                old_found = False
                for inv_item in inventory:
                    if inv_item.get("type") == old_item_id:
                        inv_item["quantity"] = inv_item.get("quantity", 0) + 1
                        old_found = True
                        break
                if not old_found:
                    inventory.append({"type": old_item_id, "quantity": 1})
                old_item = ITEMS_DB.get(old_item_id)
                old_msg = f"（卸下 {old_item.name if old_item else old_item_id}）"
            else:
                old_msg = ""
            
            # 装备新物品
            equipment[item.slot.value] = item_id
            claw.equipment = equipment
            claw.inventory = inventory
            
            # 更新属性
            claw.base_attack = claw.base_attack + item.attack_bonus
            claw.base_defense = claw.base_defense + item.defense_bonus
            claw.base_speed = claw.base_speed + item.speed_bonus
            claw.max_health = claw.max_health + item.hp_bonus
            
            await db_session.commit()
            
            slot_name = {"weapon": "武器", "armor": "护甲", "accessory": "饰品"}.get(item.slot.value, item.slot.value)
            return {"message": f"装备了 {item.name} 到{slot_name}栏位{old_msg}"}
        
        elif command == "unequip":
            """卸下装备"""
            if not args:
                return {"error": "卸下什么？用法: unequip <武器|护甲|饰品>"}
            
            slot_map = {"weapon": "weapon", "武器": "weapon", "armor": "armor", "护甲": "armor", "accessory": "accessory", "饰品": "accessory"}
            slot = slot_map.get(args[0])
            if not slot:
                return {"error": "无效的装备栏位，可用: 武器/护甲/饰品"}
            
            equipment = claw.equipment or {}
            item_id = equipment.get(slot)
            if not item_id:
                return {"error": "该栏位没有装备"}
            
            item = ITEMS_DB.get(item_id)
            if not item:
                return {"error": "装备数据错误"}
            
            # 卸下装备
            del equipment[slot]
            claw.equipment = equipment
            
            # 放回背包
            inventory = claw.inventory or []
            found = False
            for inv_item in inventory:
                if inv_item.get("type") == item_id:
                    inv_item["quantity"] = inv_item.get("quantity", 0) + 1
                    found = True
                    break
            if not found:
                inventory.append({"type": item_id, "quantity": 1})
            claw.inventory = inventory
            
            # 恢复属性
            claw.base_attack = max(1, claw.base_attack - item.attack_bonus)
            claw.base_defense = max(1, claw.base_defense - item.defense_bonus)
            claw.base_speed = max(1, claw.base_speed - item.speed_bonus)
            claw.max_health = max(10, claw.max_health - item.hp_bonus)
            
            await db_session.commit()
            
            slot_name = {"weapon": "武器", "armor": "护甲", "accessory": "饰品"}.get(slot, slot)
            return {"message": f"卸下了 {slot_name} 栏位的 {item.name}"}
        
        elif command == "talk":
            """与NPC对话"""
            if not args:
                return {"error": "和谁对话？用法: talk <NPC名>"}
            
            npc_name = args[0]
            npcs = npc_manager.get_alive_at_location(claw.location_id)
            
            target_npc = None
            for npc in npcs:
                if npc_name.lower() in npc.name.lower():
                    target_npc = npc
                    break
            
            if not target_npc:
                return {"error": f"找不到NPC: {npc_name}"}
            
            # 获取对话
            if target_npc.dialogues:
                import random
                dialogue = random.choice(target_npc.dialogues)
                return {
                    "message": f"{target_npc.name} 对你说:",
                    "dialogue": f"\"{dialogue}\"",
                }
            else:
                return {"message": f"{target_npc.name} 没有回应你。"}
        
        elif command == "npc":
            """查看周围NPC"""
            npcs = npc_manager.get_alive_at_location(claw.location_id)
            if not npcs:
                return {"message": "周围没有NPC。"}
            
            npc_list = []
            for npc in npcs:
                icon = "⚔️" if npc.type in {NPCType.ROGUE_BOT, NPCType.MUTANT, NPCType.BANDIT, NPCType.GUARDIAN} else "👤"
                npc_list.append(f"{icon} {npc.name} (Lv.{npc.level}) HP:{npc.hp}/{npc.hp_max}")
            
            return {
                "message": f"发现 {len(npcs)} 个NPC:",
                "npcs": npc_list,
            }
        
        elif command == "attack":
            """攻击NPC"""
            if not args:
                return {"error": "攻击谁？用法: attack <NPC名>"}
            
            target_name = args[0]
            npcs = npc_manager.get_alive_at_location(claw.location_id)
            
            # 查找目标NPC
            target = None
            for npc in npcs:
                if target_name.lower() in npc.name.lower():
                    target = npc
                    break
            
            if not target:
                return {"error": f"找不到目标: {target_name}"}
            
            # 执行战斗
            result = await game.combat_npc(db_session, claw_id, target)
            
            # 记录击杀统计
            if result.get("killed"):
                achievement_manager.increment_stat(claw_id, "kill_count")
                if target.type.value == "guardian":
                    achievement_manager.increment_stat(claw_id, "boss_kill_count")
            
            return result
        
        elif command == "safehouse":
            """安全屋系统"""
            if not args:
                # 查看安全屋状态
                safehouse = safehouse_manager.get_safehouse(claw_id)
                if not safehouse:
                    return {
                        "message": "你还没有安全屋。",
                        "hint": "在安全区使用 'safehouse build' 建造安全屋",
                    }
                return {
                    "message": f"🏠 {safehouse.get_level_name(safehouse.level)}",
                    "safehouse": safehouse.to_dict(),
                }
            
            subcmd = args[0]
            
            if subcmd == "build":
                # 建造安全屋
                if len(args) > 1:
                    # 建造设施
                    facility = args[1]
                    success, msg = safehouse_manager.build_facility(
                        claw_id, facility, claw.inventory or [], claw.watts
                    )
                    if success:
                        # 扣除电力
                        costs = {
                            "generator": 200, "workshop": 300, "garden": 100, "turret": 500
                        }
                        claw.watts -= costs.get(facility, 0)
                        await db_session.commit()
                    return {"message": msg} if success else {"error": msg}
                else:
                    # 建造安全屋
                    loc = get_location(claw.location_id)
                    if not loc or not loc.is_safe:
                        return {"error": "只能在安全区建造安全屋"}
                    
                    success, msg, safehouse = safehouse_manager.create_safehouse(claw_id, claw.location_id)
                    return {"message": msg} if success else {"error": msg}
            
            elif subcmd == "upgrade":
                success, msg = safehouse_manager.upgrade_safehouse(
                    claw_id, claw.inventory or [], claw.watts
                )
                if success:
                    claw.watts -= 100  # 简化处理
                    await db_session.commit()
                return {"message": msg} if success else {"error": msg}
            
            return {"error": f"未知子命令: {subcmd}"}
        
        elif command == "events":
            """查看当前事件"""
            events = event_manager.get_active_events(claw.location_id)
            if not events:
                return {"message": "当前没有活跃的世界事件。"}
            
            event_list = []
            for event in events:
                event_list.append(f"【{event.title}】{event.description[:30]}...")
            
            return {
                "message": f"当前有 {len(events)} 个活跃事件:",
                "events": event_list,
            }
        
        elif command == "achievements":
            """查看成就"""
            player_ach = achievement_manager.get_player(claw_id)
            
            unlocked = []
            for ach_id in player_ach.unlocked_achievements:
                ach = ACHIEVEMENTS_DB.get(ach_id)
                if ach:
                    unlocked.append(f"{ach.icon} {ach.name}")
            
            return {
                "message": f"🏆 已解锁成就 ({len(unlocked)}/{len(ACHIEVEMENTS_DB)}):",
                "achievements": unlocked if unlocked else ["还没有解锁任何成就"],
                "stats": player_ach.to_dict()["stats"],
                "title": player_ach.current_title or "无称号",
            }
        
        elif command == "leaderboard":
            """查看排行榜"""
            board = achievement_manager.get_leaderboard("kill_count", 5)
            
            lines = ["⚔️ 击杀排行榜:"]
            for i, entry in enumerate(board, 1):
                title = f"[{entry['title']}]" if entry['title'] else ""
                lines.append(f"  {i}. {entry['claw_id'][:10]} {title} - {entry['value']}击杀")
            
            return {"message": "\n".join(lines)}
        
        else:
            return {"error": f"未知命令: {command}。输入 'help' 查看可用命令。"}
    
    except game.GameError as e:
        return {"error": str(e)}


# ==================== WebSocket 路由 ====================

async def mud_websocket_endpoint(websocket: WebSocket, claw_id: str):
    """MUD WebSocket 入口"""
    # 先接受连接
    await websocket.accept()
    await manager.connect(websocket, claw_id)
    
    try:
        async with db.session() as session:
            # 创建或获取角色
            claw = await game.get_claw(session, claw_id)
            if not claw:
                claw = await game.create_claw(session, claw_id, f"Claw-{claw_id[:8]}")
            
            # 发送欢迎消息
            loc = get_location(claw.location_id)
            await manager.send_to(claw_id, {
                "type": "welcome",
                "message": f"欢迎来到废土世界，{claw.name}！",
                "location": loc.model_dump() if loc else None,
                "claw": claw.to_dict(),
            })
            
            # 命令循环
            while True:
                data = await websocket.receive_text()
                
                try:
                    msg = json.loads(data)
                    command = msg.get("cmd", "")
                    args = msg.get("args", [])
                except json.JSONDecodeError:
                    # 纯文本命令
                    parts = data.strip().split()
                    command = parts[0] if parts else ""
                    args = parts[1:] if len(parts) > 1 else []
                
                # 如果 cmd 包含空格，解析出实际命令和参数
                if " " in command:
                    parts = command.split()
                    command = parts[0]
                    args = parts[1:] + args
                
                # 处理命令
                result = await handle_command(claw_id, command, args, session)
                result["type"] = "command_result"
                result["command"] = command
                
                # 检查随机事件
                event = event_manager.process_tick()
                if event:
                    await manager.send_to(claw_id, {
                        "type": "event",
                        "title": event.title,
                        "description": event.description,
                    })
                
                # 检查成就
                player_ach = achievement_manager.get_player(claw_id)
                new_achievements = player_ach.check_achievements()
                for ach in new_achievements:
                    await manager.send_to(claw_id, {
                        "type": "achievement",
                        "title": f"🏆 解锁成就: {ach.name}",
                        "description": ach.description,
                        "reward": f"⚡{ach.reward_power} 🧠{ach.reward_flops}",
                    })
                
                await manager.send_to(claw_id, result)
    
    except WebSocketDisconnect:
        manager.disconnect(claw_id)
    except Exception as e:
        logger.error(f"WebSocket 错误: {e}")
        manager.disconnect(claw_id)