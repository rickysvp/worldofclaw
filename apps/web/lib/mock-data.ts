import type {
  ActionLog,
  ClawState,
  DecisionCard,
  DecisionCardsResponse,
  InventoryItem,
  MockUserSession,
  MyClawResponse,
  StatusResponse,
  WorldFeedEvent,
  WorldFeedFilter,
  WorldFeedResponse,
  WorldStatus
} from "./types";

const mock_epoch_ms = Date.now();
const base_tick = 14820;

const clone = <T>(value: T): T => structuredClone(value);

const session: MockUserSession = {
  user_id: "user_mock_ricky",
  display_name: "Ricky / Watcher-01",
  active_claw_name: "沙咬-7",
  status_label: "Mock Session 在线"
};

const inventory: InventoryItem[] = [
  { id: "wood", item_type: "wood", label: "废木板", quantity: 14, quality: "rough" },
  { id: "scrap", item_type: "scrap", label: "金属废料", quantity: 7, quality: "stable" },
  { id: "battery", item_type: "power", label: "备用电芯", quantity: 4, quality: "stable" },
  { id: "circuit", item_type: "circuit", label: "裸露线路板", quantity: 2, quality: "refined" },
  { id: "rations", item_type: "food", label: "冷封口补给", quantity: 3, quality: "stable" }
];

const action_logs: ActionLog[] = [
  { id: "log_01", timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(), action_type: "trade", summary: "在庇护站 Alpha 卖出 6 单位废木板，换回 18 credits。", outcome: "success", location: "庇护站 Alpha", risk_level: "low" },
  { id: "log_02", timestamp: new Date(Date.now() - 27 * 60 * 1000).toISOString(), action_type: "charge", summary: "在中继桩完成补能，恢复 6 点 power。", outcome: "success", location: "旧中继坡", risk_level: "low" },
  { id: "log_03", timestamp: new Date(Date.now() - 39 * 60 * 1000).toISOString(), action_type: "move", summary: "穿过北侧废墟带，绕开一处争夺区。", outcome: "warning", location: "北侧废墟带", risk_level: "medium" },
  { id: "log_04", timestamp: new Date(Date.now() - 54 * 60 * 1000).toISOString(), action_type: "salvage", summary: "回收废木板和低质电芯。", outcome: "success", location: "北侧废墟带", risk_level: "medium" },
  { id: "log_05", timestamp: new Date(Date.now() - 71 * 60 * 1000).toISOString(), action_type: "repair", summary: "临时修补左前爪关节，耐久恢复 10。", outcome: "success", location: "旧中继坡", risk_level: "low" },
  { id: "log_06", timestamp: new Date(Date.now() - 83 * 60 * 1000).toISOString(), action_type: "scan", summary: "侦测到夜港方向木材报价上涨。", outcome: "success", location: "旧中继坡", risk_level: "low" },
  { id: "log_07", timestamp: new Date(Date.now() - 96 * 60 * 1000).toISOString(), action_type: "escort", summary: "放弃高风险护送单，改走保守路线。", outcome: "warning", location: "裂谷公路", risk_level: "high" },
  { id: "log_08", timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), action_type: "trade", summary: "与流浪工坊完成零件交换。", outcome: "success", location: "庇护站 Alpha", risk_level: "low" },
  { id: "log_09", timestamp: new Date(Date.now() - 152 * 60 * 1000).toISOString(), action_type: "move", summary: "从旧中继坡返回安全区。", outcome: "success", location: "庇护站 Alpha", risk_level: "low" },
  { id: "log_10", timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(), action_type: "salvage", summary: "回收一批潮湿木材，品质一般。", outcome: "warning", location: "下沉工坊遗址", risk_level: "medium" }
];

const baseEvents: WorldFeedEvent[] = [
  { id: "event_01", timestamp: "", event_type: "market", title: "庇护站 Alpha 木材收购价上浮", summary: "安全区今天上调了基础木材回收价，低风险商路重新活跃。", sector_name: "庇护站 Alpha", related_agents: ["沙咬-7"], severity: "medium", filter_tags: ["all", "market", "my_claw", "nearby"], is_my_claw_related: true },
  { id: "event_02", timestamp: "", event_type: "conflict", title: "裂谷公路出现临时截停", summary: "两支护送队在废土公路对峙，路线风险升高。", sector_name: "裂谷公路", related_agents: ["灰烬犬小队"], severity: "high", filter_tags: ["all", "conflict", "nearby"], is_my_claw_related: false },
  { id: "event_03", timestamp: "", event_type: "organization", title: "旧中继坡自发形成物资互助网", summary: "多个 OpenClaw 开始共享发电机与存储设施，组织雏形出现。", sector_name: "旧中继坡", related_agents: ["沙咬-7", "泊火-2"], severity: "medium", filter_tags: ["all", "organization", "my_claw", "nearby"], is_my_claw_related: true },
  { id: "event_04", timestamp: "", event_type: "system", title: "世界同步已完成", summary: "规则引擎刚完成一次 tick 推进，新的任务结果已入账。", sector_name: "系统层", related_agents: [], severity: "low", filter_tags: ["all"], is_my_claw_related: false },
  { id: "event_05", timestamp: "", event_type: "market", title: "夜港黑市出现低价电芯", summary: "短时抛售导致 power 相关配件价格下探。", sector_name: "夜港黑市", related_agents: ["盐雾搬运组"], severity: "medium", filter_tags: ["all", "market"], is_my_claw_related: false },
  { id: "event_06", timestamp: "", event_type: "nearby", title: "沙咬-7 回到安全区边缘", summary: "你的 Claw 已回到庇护站外圈，可低风险处理交易与补给。", sector_name: "庇护站 Alpha", related_agents: ["沙咬-7"], severity: "low", filter_tags: ["all", "my_claw", "nearby"], is_my_claw_related: true },
  { id: "event_07", timestamp: "", event_type: "conflict", title: "旧发电站控制权再度摇摆", summary: "两个组织都在抢修发电机，区块进入 contested。", sector_name: "旧发电站", related_agents: ["泊火-2", "盲钳-4"], severity: "critical", filter_tags: ["all", "conflict", "organization"], is_my_claw_related: false },
  { id: "event_08", timestamp: "", event_type: "market", title: "废木板库存紧张", summary: "工坊维修需求抬头，粗木材短缺正在扩大。", sector_name: "下沉工坊遗址", related_agents: [], severity: "medium", filter_tags: ["all", "market"], is_my_claw_related: false },
  { id: "event_09", timestamp: "", event_type: "organization", title: "裂谷公路护送盟约提议开启", summary: "多个护送 Claw 正尝试建立临时通行规则。", sector_name: "裂谷公路", related_agents: ["沙咬-7"], severity: "high", filter_tags: ["all", "organization", "my_claw"], is_my_claw_related: true },
  { id: "event_10", timestamp: "", event_type: "nearby", title: "北侧废墟带回收窗口打开", summary: "风暴短暂停歇，附近废墟的回收收益提高。", sector_name: "北侧废墟带", related_agents: ["沙咬-7"], severity: "low", filter_tags: ["all", "nearby", "my_claw"], is_my_claw_related: true },
  { id: "event_11", timestamp: "", event_type: "market", title: "中继维修报价上调", summary: "relay 服务成本上升，长距离通信预算压力变大。", sector_name: "旧中继坡", related_agents: [], severity: "medium", filter_tags: ["all", "market", "nearby"], is_my_claw_related: false },
  { id: "event_12", timestamp: "", event_type: "system", title: "新手保护仍在生效", summary: "你的 Claw 目前仍在保护窗口内，公开冲突权重被压低。", sector_name: "系统层", related_agents: ["沙咬-7"], severity: "low", filter_tags: ["all", "my_claw"], is_my_claw_related: true },
  { id: "event_13", timestamp: "", event_type: "conflict", title: "废土公路发生短时火并", summary: "一支运输队被迫改变路线，夜间护送单风险走高。", sector_name: "裂谷公路", related_agents: [], severity: "high", filter_tags: ["all", "conflict"], is_my_claw_related: false },
  { id: "event_14", timestamp: "", event_type: "organization", title: "庇护站议事台发出设施共用倡议", summary: "如果更多 Claw 参与，安全区的组织等级可能提升。", sector_name: "庇护站 Alpha", related_agents: ["沙咬-7"], severity: "medium", filter_tags: ["all", "organization", "my_claw", "nearby"], is_my_claw_related: true },
  { id: "event_15", timestamp: "", event_type: "market", title: "compute_core 黑市溢价扩大", summary: "高阶部件继续紧缺，普通回收者难以跟上报价。", sector_name: "夜港黑市", related_agents: [], severity: "high", filter_tags: ["all", "market"], is_my_claw_related: false },
  { id: "event_16", timestamp: "", event_type: "nearby", title: "庇护站外墙感应器重启", summary: "附近可见范围略有扩大，短时更容易看清邻近事件。", sector_name: "庇护站 Alpha", related_agents: ["沙咬-7"], severity: "low", filter_tags: ["all", "nearby", "my_claw"], is_my_claw_related: true },
  { id: "event_17", timestamp: "", event_type: "system", title: "平台记录服务正常", summary: "日志、审计和回放链路均已保持绿色。", sector_name: "系统层", related_agents: [], severity: "low", filter_tags: ["all"], is_my_claw_related: false },
  { id: "event_18", timestamp: "", event_type: "conflict", title: "旧存储站发生夺取尝试", summary: "一个 storage 设施点进入争夺前兆状态。", sector_name: "旧存储站", related_agents: ["盲钳-4"], severity: "medium", filter_tags: ["all", "conflict", "organization"], is_my_claw_related: false },
  { id: "event_19", timestamp: "", event_type: "market", title: "废料换修理时段已开放", summary: "repair 服务现在接受更低批量的 scrap 支付。", sector_name: "庇护站 Alpha", related_agents: ["沙咬-7"], severity: "low", filter_tags: ["all", "market", "my_claw", "nearby"], is_my_claw_related: true },
  { id: "event_20", timestamp: "", event_type: "organization", title: "旧中继坡物资共管提案临近表决", summary: "如果通过，成员和非成员访问将出现明显差异。", sector_name: "旧中继坡", related_agents: ["泊火-2", "沙咬-7"], severity: "high", filter_tags: ["all", "organization", "my_claw"], is_my_claw_related: true }
];

const baseClawState: ClawState = {
  claw_id: "claw_sandbite_7",
  claw_name: "沙咬-7",
  role: "拾荒商",
  current_sector: "庇护站 Alpha",
  power: 14,
  durability: 78,
  credits: 86,
  cargo: "9 / 20",
  trust_summary: "与庇护站工坊维持稳定信任，与裂谷路线护送联盟处于观察合作阶段。",
  organization: "旧中继坡互助网（观察成员）",
  current_objective: "在保护期结束前，完成一次低风险贸易并补足备用 power。",
  current_action: "正在整理上一轮回收品，等待下一条批准。",
  last_completed_action: "卖出 6 单位废木板并完成一次补能。",
  is_safe: true,
  missing_needs: ["补足 1 次 repair 预算", "确认裂谷公路风险", "更新夜港价格认知"],
  best_intervention: "先批准一张低风险交易卡，稳定 credits，再决定是否接路线单。",
  action_logs,
  inventory,
  onboarding_status: [
    { label: "引导完成", tone: "complete", detail: "已完成接入与初始落点分配。" },
    { label: "保护期中", tone: "safe", detail: "剩余 4 tick，冲突权重被抑制。" },
    { label: "尚未毕业", tone: "active", detail: "完成 1 次高价值批准后进入稳定运营。" }
  ],
  recommended_actions: [
    { id: "next_1", label: "批准低风险木材卖单", reason: "能最快补厚 credits 并降低库存压力。", intervention_value: "高" },
    { id: "next_2", label: "把路线风险封顶为中", reason: "可避免保护期内误入争夺区。", intervention_value: "中" },
    { id: "next_3", label: "预留 20 credits 维修预算", reason: "耐久不差，但下一次远行前最好锁定修理能力。", intervention_value: "中" }
  ],
  last_night_summary: "昨夜沙咬-7 在北侧废墟带完成了两次回收，避开了裂谷公路的一场火并，并在黎明前回到庇护站 Alpha。它赚到了 18 credits，但也暴露出 power 储备不足和路线情报滞后的问题。"
};

const baseDecisionCards: DecisionCard[] = [
  {
    decision_id: "decision_trade_01",
    decision_type: "trade",
    title: "是否立即卖出 8 单位废木板",
    reason: "庇护站 Alpha 的木材回收价刚上浮，这一轮报价在过去 6 tick 里最稳定。",
    risk_level: "low",
    expires_in: "14 分钟",
    recommended_option: "approve",
    options: [
      { id: "approve", label: "批准卖出", consequence_hint: "快速换回 credits，库存压力下降。" },
      { id: "reject", label: "暂缓处理", consequence_hint: "继续等待价格，但可能错过当前高价。" },
      { id: "modify", label: "改成部分卖出", consequence_hint: "保留一部分库存以应对 repair/build 需求。" }
    ],
    affected_resources: ["废木板", "credits"],
    affected_location: "庇护站 Alpha",
    quantity: 8,
    route_risk: "low",
    budget_cap: 0,
    status: "pending",
    last_updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    decision_id: "decision_route_02",
    decision_type: "route",
    title: "是否允许穿越裂谷公路去夜港黑市",
    reason: "夜港的电芯报价更低，但裂谷公路刚出现短时火并，路径不稳定。",
    risk_level: "medium",
    expires_in: "22 分钟",
    recommended_option: "modify",
    options: [
      { id: "approve", label: "批准原路线", consequence_hint: "能更快拿到低价电芯，但冲突暴露上升。" },
      { id: "reject", label: "拒绝远行", consequence_hint: "继续留在安全区经营，错过低价窗口。" },
      { id: "modify", label: "改走保守路线", consequence_hint: "延长到达时间，但显著降低冲突概率。" }
    ],
    affected_resources: ["power", "credits", "情报窗口"],
    affected_location: "裂谷公路 -> 夜港黑市",
    quantity: 0,
    route_risk: "medium",
    budget_cap: 28,
    status: "pending",
    last_updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    decision_id: "decision_escort_03",
    decision_type: "escort",
    title: "是否加入高风险护送与设施争夺联合行动",
    reason: "一支组织化队伍邀请沙咬-7 参与旧存储站外围护送，可能换来长期访问权。",
    risk_level: "high",
    expires_in: "9 分钟",
    recommended_option: "reject",
    options: [
      { id: "approve", label: "批准加入", consequence_hint: "若成功可获得组织关系与设施利益，但损耗和冲突大。" },
      { id: "reject", label: "拒绝参与", consequence_hint: "继续保留保护期红利和低风险经营节奏。" },
      { id: "modify", label: "限制预算与风险", consequence_hint: "仅允许外围护送，不参与核心争夺。" }
    ],
    affected_resources: ["durability", "bond", "organization standing"],
    affected_location: "旧存储站外围",
    quantity: 1,
    route_risk: "high",
    budget_cap: 36,
    status: "pending",
    last_updated_at: new Date(Date.now() - 1 * 60 * 1000).toISOString()
  },
  {
    decision_id: "decision_done_04",
    decision_type: "trade",
    title: "上一轮低价电芯采购已处理",
    reason: "你已把预算上限压低到 18 credits，并批准延后执行。",
    risk_level: "low",
    expires_in: "已处理",
    recommended_option: "modify",
    options: [
      { id: "approve", label: "批准", consequence_hint: "已处理。" },
      { id: "reject", label: "拒绝", consequence_hint: "已处理。" },
      { id: "modify", label: "修改", consequence_hint: "已处理。" }
    ],
    affected_resources: ["credits"],
    affected_location: "夜港黑市",
    quantity: 4,
    route_risk: "low",
    budget_cap: 18,
    status: "processed",
    last_updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    decision_id: "decision_expired_05",
    decision_type: "route",
    title: "昨夜裂谷临时绕行窗口已过期",
    reason: "冲突扩散后，原提案已不再可执行。",
    risk_level: "medium",
    expires_in: "已过期",
    recommended_option: "reject",
    options: [
      { id: "approve", label: "批准", consequence_hint: "已过期。" },
      { id: "reject", label: "拒绝", consequence_hint: "已过期。" },
      { id: "modify", label: "修改", consequence_hint: "已过期。" }
    ],
    affected_resources: ["route"],
    affected_location: "裂谷公路",
    quantity: 0,
    route_risk: "high",
    budget_cap: 12,
    status: "expired",
    last_updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  }
];

let decision_store: DecisionCard[] = clone(baseDecisionCards);

const getLiveTick = (): number => base_tick + Math.floor((Date.now() - mock_epoch_ms) / 12000);

const rotate = <T>(items: ReadonlyArray<T>, offset: number): T[] => {
  if (items.length === 0) {
    return [];
  }
  const normalized_offset = offset % items.length;
  return [...items.slice(normalized_offset), ...items.slice(0, normalized_offset)];
};

const withLiveTimestamps = (events: ReadonlyArray<WorldFeedEvent>): WorldFeedEvent[] => {
  const now = Date.now();
  return events.map((event, index) => ({
    ...event,
    timestamp: new Date(now - index * 4 * 60 * 1000).toISOString()
  }));
};

export const getMockSession = (): MockUserSession => clone(session);

export const getWorldStatus = (): WorldStatus => {
  const tick = getLiveTick();
  return {
    world_tick: tick,
    online_claw_count: 47 + (tick % 6),
    contested_sector_count: 2 + (tick % 3),
    today_platform_event_count: 132 + (tick % 19),
    today_goal_hint: "让沙咬-7 在保护期内完成一次稳定贸易，并决定是否接高风险护送。",
    current_risk_level: tick % 4 === 0 ? "high" : tick % 3 === 0 ? "medium" : "low",
    last_sync_at: new Date().toISOString()
  };
};

export const getWorldFeed = (filter: WorldFeedFilter): WorldFeedResponse => {
  const tick = getLiveTick();
  const rotated = rotate(baseEvents, tick % baseEvents.length).map((event, index) =>
    index === 0
      ? {
          ...event,
          summary: `${event.summary} 当前世界 tick 已推进到 ${tick}。`
        }
      : event
  );
  const events = withLiveTimestamps(rotated)
    .filter((event) => filter === "all" || event.filter_tags.includes(filter))
    .slice(0, 20);

  return {
    session: getMockSession(),
    status: getWorldStatus(),
    events
  };
};

export const getMyClaw = (): MyClawResponse => {
  const live_tick = getLiveTick();
  const claw = clone(baseClawState);
  claw.power = 12 + (live_tick % 4);
  claw.credits = 80 + (live_tick % 9) * 2;
  claw.current_action = live_tick % 2 === 0 ? "等待你批准一张新的路线决策卡。" : "正在对昨夜回收物做出货前整理。";
  claw.current_sector = live_tick % 3 === 0 ? "旧中继坡" : "庇护站 Alpha";
  claw.best_intervention = live_tick % 2 === 0 ? "先定路线风险，再让它出门。" : "先批准卖单，把 credits 提起来。";
  const protection_badge = claw.onboarding_status[1];
  if (protection_badge) {
    claw.onboarding_status[1] = {
      label: protection_badge.label,
      tone: protection_badge.tone,
    detail: `剩余 ${Math.max(1, 6 - (live_tick % 5))} tick，仍有保护。`
    };
  }

  return {
    session: getMockSession(),
    status: getWorldStatus(),
    claw
  };
};

export const getDecisionCards = (): DecisionCardsResponse => ({
  session: getMockSession(),
  status: getWorldStatus(),
  cards: clone(decision_store)
});

export const resetDecisionCards = (): void => {
  decision_store = clone(baseDecisionCards);
};

export const getStatusResponse = (): StatusResponse => ({
  session: getMockSession(),
  status: getWorldStatus()
});
