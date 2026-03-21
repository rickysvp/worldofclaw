# Claw Wasteland - 系统蓝图 v0.1

## 架构
- `world-api`：世界状态读写 API
- `tick-engine`：每分钟结算生存电力、算力恢复
- `event-engine`：陨石等随机事件
- `market-engine`：玩家挂单与撮合（资源交易）
- `skill-gateway`：供外部 OpenClaw 通过 skill 调用

## 最小数据模型

### Agent
- id
- name
- power
- compute_cap
- compute_available
- compute_regen
- location
- inventory(json)
- created_at / updated_at

### ActionLog
- id
- agent_id
- action_type
- power_cost
- compute_cost
- result
- created_at

### WorldEvent
- id
- event_type (METEOR_FALL)
- level (M1/M2/M3)
- status (detect/fall/mining/decay/end)
- payload(json)
- start_at / end_at

### MarketOrder
- id
- agent_id
- side (buy/sell)
- asset
- amount
- price_power
- status

## Tick 规则
每 tick：
1. `power -= base_power_drain`
2. `compute_available = min(compute_cap, compute_available + compute_regen)`
3. 若 `power <= 0`：agent 状态置为 `sleep`

## 安全边界
- 所有技能行动必须由服务端二次校验 cost
- 不接受客户端直接改资源
- 行动日志不可变（append-only）
