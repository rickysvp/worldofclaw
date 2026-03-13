# Claw World V0.1 Database Schema Mapping

## 目标
把最新的规则文档映射成可直接实现的链下数据库对象，覆盖：
- runtime 决策链
- Telegram 绑定与命令审计
- command_outbox 投递
- 高风险动作冻结与恢复
- 账本、批次、结算映射

## 总体原则
- Postgres 是世界真相来源。
- 所有高风险动作都必须先写 snapshot，再写冻结记录，再进入 decision。
- Telegram 只写 approval，不直接改 world state。
- command_outbox 是 approval 到 runtime 的唯一结构化桥。
- 所有关键记录都必须带 `correlation_id`。

## 表清单

### 1. runtimes
用途：记录 runtime 生命周期与当前状态。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | runtime 主键 |
| claw_id | text | not null, fk | 关联 claw |
| user_id | text | not null, fk | 所属 user |
| status | text | not null | active / pending_decision / waiting_user_response / approved / rejected / modified / expired / command_queued / command_delivered / command_acknowledged / resumed / failed_recovery |
| current_world_tick | bigint | not null | 当前观测到的 world_tick |
| last_snapshot_id | text | nullable, fk | 最近一次冻结前 snapshot |
| pending_decision_id | text | nullable, fk | 当前阻塞中的 decision |
| last_heartbeat_at | timestamptz | nullable | 最近一次 heartbeat |
| last_command_pull_at | timestamptz | nullable | 最近一次拉取 command_outbox |
| recovery_applied | boolean | not null default false | 防止重复恢复 |
| correlation_id | text | nullable | 当前主链路标识 |
| created_at | timestamptz | not null | 创建时间 |
| updated_at | timestamptz | not null | 更新时间 |

### 2. telegram_bindings
用途：把 Telegram chat_id 绑定到 user/runtime 操作范围。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | 绑定记录主键 |
| chat_id | text | not null unique | Telegram chat_id |
| user_id | text | not null, fk | 绑定 user |
| runtime_scope | jsonb | not null | 可操作 runtime 列表或范围 |
| binding_status | text | not null | pending / active / revoked |
| created_at | timestamptz | not null | 创建时间 |
| updated_at | timestamptz | not null | 更新时间 |

### 3. decisions
用途：记录所有需要 approval 的结构化决策。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | decision_id |
| runtime_id | text | not null, fk | 对应 runtime |
| claw_id | text | not null, fk | 对应 claw |
| user_id | text | not null, fk | 对应 user |
| decision_type | text | not null | high_value_trade / high_risk_route_change / dangerous_escort / rare_resource_commit / faction_alignment / vault_withdrawal / emergency_shutdown_override |
| status | text | not null | pending_decision / waiting_user_response / approved / rejected / modified / expired / resumed / failed_recovery |
| risk_level | text | not null | low / medium / high |
| trigger_snapshot_id | text | not null, fk | 触发时 snapshot |
| correlation_id | text | not null | 主链路标识 |
| required_snapshot_fields | jsonb | not null | 当时要求保留的关键视图 |
| approval_required | boolean | not null | 是否阻塞 |
| timeout_seconds | integer | not null | 超时秒数 |
| timeout_behavior | text | not null | 超时策略 |
| recommendation | jsonb | not null | 推荐方案与理由 |
| frozen_commitment_refs | jsonb | not null | 冻结账本 refs |
| created_at_world_tick | bigint | not null | 触发 world_tick |
| expires_at | timestamptz | not null | 过期时间 |
| finalized_at | timestamptz | nullable | 终局时间 |
| created_at | timestamptz | not null | 创建时间 |
| updated_at | timestamptz | not null | 更新时间 |

### 4. decision_responses
用途：记录 Telegram 或 admin 的结构化 approval。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | response 主键 |
| decision_id | text | not null, fk | 关联 decision |
| source_channel | text | not null | telegram_primary / internal_admin_console |
| source_actor_type | text | not null | user / admin |
| source_actor_id | text | not null | user_id 或 admin_id |
| approval | text | not null | approve / reject / modified |
| patch | jsonb | not null default '{}' | quantity / budget_cap / route_risk 等结构化修改 |
| idempotency_key | text | not null unique | 去重键 |
| correlation_id | text | not null | 链路标识 |
| created_at | timestamptz | not null | 创建时间 |

### 5. command_outbox
用途：把 approval 结果投递给 runtime。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | command 主键 |
| runtime_id | text | not null, fk | 接收 runtime |
| claw_id | text | not null, fk | 对应 claw |
| user_id | text | not null, fk | 对应 user |
| decision_id | text | nullable, fk | 来源 decision |
| command_type | text | not null | execute_trade_decision / apply_route_change / execute_escort_contract / commit_rare_resource / apply_faction_alignment / execute_vault_withdrawal / execute_shutdown_override / request_runtime_status |
| command_payload | jsonb | not null | 结构化命令 |
| delivery_status | text | not null | queued / delivered / acknowledged / expired / failed |
| delivery_attempts | integer | not null default 0 | 投递次数 |
| expires_at | timestamptz | not null | 命令有效期 |
| correlation_id | text | not null | 链路标识 |
| created_at_world_tick | bigint | not null | 创建时 tick |
| created_at | timestamptz | not null | 创建时间 |
| updated_at | timestamptz | not null | 更新时间 |

### 6. command_ack_log
用途：记录 runtime 拉取和确认 command 的过程。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | ack 记录主键 |
| command_id | text | not null, fk | 对应 command_outbox |
| runtime_id | text | not null, fk | 对应 runtime |
| ack_type | text | not null | pulled / acknowledged / failed |
| ack_payload | jsonb | not null | 结构化回执 |
| correlation_id | text | not null | 链路标识 |
| created_at | timestamptz | not null | 创建时间 |

### 7. runtime_snapshots
用途：决策前冻结、恢复、回放与审计基线。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | snapshot 主键 |
| runtime_id | text | not null, fk | 关联 runtime |
| claw_id | text | not null, fk | 关联 claw |
| world_tick | bigint | not null | snapshot 所在 tick |
| snapshot_type | text | not null | decision_trigger / recovery_point / replay_anchor |
| snapshot_hash | text | not null | 内容 hash |
| snapshot_payload | jsonb | not null | 结构化快照 |
| correlation_id | text | not null | 链路标识 |
| created_at | timestamptz | not null | 创建时间 |

### 8. telegram_message_log
用途：记录 Telegram 入站与出站消息及命令解析结果。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | 消息日志主键 |
| chat_id | text | not null | Telegram chat_id |
| direction | text | not null | inbound / outbound |
| message_id | text | not null | 平台消息 id |
| runtime_id | text | nullable, fk | 对应 runtime |
| decision_id | text | nullable, fk | 对应 decision |
| parsed_command | jsonb | not null default '{}' | 结构化命令解析 |
| parse_status | text | not null | parsed / rejected / duplicate |
| idempotency_key | text | nullable | 去重键 |
| correlation_id | text | nullable | 链路标识 |
| created_at | timestamptz | not null | 创建时间 |

### 9. ledger_entries
用途：统一账本主表，对应 `ledger_schema.yaml`。

关键字段：
- `entry_id`
- `domain`
- `entry_type`
- `owner_type`
- `owner_id`
- `counterparty_type`
- `counterparty_id`
- `resource_type`
- `quantity`
- `unit`
- `source_type`
- `source_id`
- `caused_by_action`
- `caused_by_event`
- `decision_id`
- `session_id`
- `world_tick`
- `status`
- `created_at`
- `finalized_at`
- `metadata`
- `correlation_id`

### 10. resource_batches
用途：追踪批次资源来源与消耗去向。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | 批次主键 |
| resource_type | text | not null | 资源类型 |
| origin_domain | text | not null | 生成域 |
| origin_entry_id | text | not null, fk | 来源账本 |
| current_owner_type | text | not null | 当前拥有者类型 |
| current_owner_id | text | not null | 当前拥有者 |
| remaining_quantity | bigint | not null | 剩余数量 |
| unit | text | not null | 单位 |
| status | text | not null | active / reserved / consumed / settled |
| correlation_id | text | not null | 链路标识 |
| created_at | timestamptz | not null | 创建时间 |
| updated_at | timestamptz | not null | 更新时间 |

### 11. chain_settlement_mappings
用途：链下账本到 Monad `settlement_epoch` 的映射。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | pk | 映射主键 |
| settlement_epoch | text | not null | 结算批次编号 |
| source_entry_ids | jsonb | not null | 参与链上结算的账本项 |
| merkle_root | text | not null | 锚定根 |
| chain_tx_hash | text | nullable | 上链交易哈希 |
| status | text | not null | prepared / anchored / finalized / disputed |
| created_at | timestamptz | not null | 创建时间 |
| finalized_at | timestamptz | nullable | 最终确认时间 |

## 索引建议
- `decisions(runtime_id, status)`
- `decisions(user_id, created_at_world_tick desc)`
- `decision_responses(decision_id, created_at)`
- `command_outbox(runtime_id, delivery_status, created_at)`
- `ledger_entries(owner_type, owner_id, world_tick)`
- `ledger_entries(domain, decision_id)`
- `telegram_message_log(chat_id, created_at)`
- `runtime_snapshots(runtime_id, world_tick desc)`
- `chain_settlement_mappings(settlement_epoch)`

## 关键实现约束
- `decisions.status` 与 `runtimes.status` 必须在事务内同步更新。
- 冻结型账本必须先于 Telegram 投递成功落库。
- `command_outbox` 写入必须依赖有效终局 approval。
- `decision_responses.idempotency_key` 与 `telegram_message_log` 去重键必须统一策略。
- 所有恢复流程必须先读取 `runtime_snapshots`，不得基于当前运行态直接猜测回滚。

## 与现有模块的对应关系
- `packages/rules` -> 触发高风险动作与冻结规则
- `packages/economy` -> ledger_entries / resource_batches / chain_settlement_mappings
- `packages/skill-bridge` -> runtimes / command_outbox / command_ack_log
- `packages/audit` -> runtime_snapshots / ledger_entries / decision_responses / telegram_message_log
- `services/api` -> runtimes / decisions / command_outbox / telegram_message_log
- `services/admin` -> 审计、重放、异常告警
- `services/platform` -> 权限、计费、封禁，但不直接写 world state
