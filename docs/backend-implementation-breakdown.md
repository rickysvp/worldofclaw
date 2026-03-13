# Claw World V0.1 Backend Implementation Breakdown

## 目标
把新的 Telegram 主决策链路拆成后端可执行任务，按模块、接口、数据对象和验收方式给出实现顺序。

## 总体实现顺序
1. 数据模型对齐
2. 高风险 decision 链路
3. Telegram Gateway
4. command_outbox 与 runtime 恢复
5. 冻结账本与 settlement_epoch 映射
6. 审计、回放、恢复
7. 前端观察入口改读真实数据

## 模块拆分

### A. Decision Core
负责：高风险动作冻结、decision 创建、approval 终局、超时 fallback。

#### 任务 A1：创建 decision 数据模型
- 依赖文件：
  - `config/decision_rules.yaml`
  - `config/ledger_schema.yaml`
- 需要落地：
  - `decisions`
  - `decision_responses`
  - `runtime_snapshots`
- 验收：
  - 可创建一个 `high_value_trade` decision
  - 可写 snapshot
  - 可写 frozen commitment

#### 任务 A2：实现 decision service
- 输入：高风险动作触发结果
- 输出：
  - snapshot
  - decision
  - 冻结账本记录
  - correlation_id
- 验收：
  - 同一动作不会重复创建 decision
  - decision 具备 timeout 信息

#### 任务 A3：实现 decision timeout worker
- 输入：待过期 decision
- 输出：expired / fallback 结果
- 验收：
  - 超时后能自动走 `timeout_behavior`
  - 回滚或保留行为可审计

### B. Telegram Gateway
负责：Telegram 绑定、消息模板投递、命令解析、approval 写入。

#### 任务 B1：绑定关系模型
- 表：`telegram_bindings`
- 核心约束：
  - 一个 `chat_id` 只能操作其绑定的 runtime
- 验收：
  - 未绑定 chat_id 的命令被拒绝

#### 任务 B2：消息发送模板
- 来源文档：`docs/telegram_protocol.md`
- 类型：
  - 状态汇报
  - 高风险决策请求
  - 超时提醒
  - 执行回报
- 验收：
  - 所有模板能带 decision_id / correlation_id

#### 任务 B3：命令解析器
- 支持：
  - `/status`
  - `/approve <decision_id>`
  - `/reject <decision_id>`
  - `/modify <decision_id> quantity <value>`
  - `/modify <decision_id> budget_cap <value>`
  - `/modify <decision_id> route_risk <value>`
- 验收：
  - 命令能稳定解析成结构化 payload
  - 不允许自由文本直接改 world state

#### 任务 B4：消息审计与去重
- 表：`telegram_message_log`
- 核心键：`idempotency_key`
- 验收：
  - Telegram 重发不会重复 approval

### C. Command Outbox Runtime Bridge
负责：把 approval 结果交给 runtime，并确认拉取/执行/恢复。

#### 任务 C1：command_outbox service
- approved / modified 的 decision 必须写 `command_outbox`
- 验收：
  - decision 与 command_outbox 通过 correlation_id 一一可追踪

#### 任务 C2：runtime command ack
- 表：`command_ack_log`
- 状态：
  - pulled
  - acknowledged
  - failed
- 验收：
  - runtime 拉到命令后能回执
  - 重复回执不重复恢复

#### 任务 C3：runtime 状态机接线
- 来源文档：`docs/runtime_decision_state_machine.md`
- 验收：
  - `active -> pending_decision -> waiting_user_response -> approved/modified/rejected/expired -> command_queued -> command_delivered -> command_acknowledged -> resumed`
  - `failed_recovery` 有告警

### D. Ledger and Settlement
负责：冻结、解冻、转正、回滚、链上映射。

#### 任务 D1：frozen_commitment 账本域
- 来源文件：`config/ledger_schema.yaml`
- 验收：
  - 高风险 trade 能先冻结再审批

#### 任务 D2：approval 转正与回滚
- approve：冻结 -> 正式 settlement
- reject：冻结 -> rollback / release
- 验收：
  - move/trade/vault withdrawal 三类都能完整落账

#### 任务 D3：resource batch 跟踪
- 表：`resource_batches`
- 验收：
  - rare resource 可追来源和去向

#### 任务 D4：settlement_epoch 映射
- 表：`chain_settlement_mappings`
- 验收：
  - 可把一批链下账本记录打包成一个 `settlement_epoch`

### E. Audit and Recovery
负责：回放、争议处理、恢复与审计。

#### 任务 E1：snapshot replay
- 输入：runtime_id + world_tick
- 输出：重建当时 decision 触发上下文
- 验收：
  - 能解释“为什么触发审批”

#### 任务 E2：approval 审计
- 输入：decision_id
- 输出：
  - Telegram 发送记录
  - user 响应
  - command_outbox
  - runtime ack
  - ledger trace
- 验收：
  - 单个 correlation_id 链完整可查

#### 任务 E3：恢复工具
- 处理：
  - Telegram 成功但 runtime 未拉取 command
  - expired fallback 失败
  - rollback 失败
- 验收：
  - 不出现重复恢复

### F. Frontend Observation Alignment
负责：让前端只看观察数据，不做主决策。

#### 任务 F1：Decision Inbox 降级
- 前端仅保留历史和调试视图
- 验收：
  - 不再作为主决策入口

#### 任务 F2：World Feed / My Claw 改读真实 decision 状态摘要
- 输入：真实 API
- 输出：
  - 当前是否 pending_decision
  - 最近 approval 结果
  - 最近 command_outbox 状态
- 验收：
  - 用户能在前端看见状态，但必须去 Telegram 做高风险决策

## API 建议拆分

### 1. Runtime Decision API
- `POST /internal/decisions/create`
- `POST /internal/decisions/:id/expire`
- `GET /internal/decisions/:id`
- `GET /internal/decisions?runtime_id=...`

### 2. Telegram Gateway API
- `POST /telegram/webhook`
- `POST /telegram/send-decision`
- `POST /telegram/send-status`

### 3. Command Outbox API
- `GET /runtime/commands`
- `POST /runtime/commands/:id/ack`
- `POST /runtime/commands/:id/fail`

### 4. Audit API
- `GET /admin/decisions/:id/audit`
- `GET /admin/correlation/:correlation_id`
- `GET /admin/runtime/:runtime_id/snapshots`

## 测试优先级
1. decision 创建与冻结
2. Telegram 审批命令解析
3. command_outbox 投递与 ack
4. 超时 fallback
5. approval 回滚与转正账本
6. settlement_epoch 映射
7. correlation_id 全链路审计

## 第一批必须完成的最小闭环
1. runtime 触发一个 `high_value_trade`
2. 系统创建 snapshot + decision + frozen commitment
3. Telegram 发送决策请求
4. user 发送 `/approve <decision_id>`
5. 系统写 `decision_responses` + `command_outbox`
6. runtime 拉取 command 并 ack
7. 系统写 settlement 账本并释放冻结
8. admin 能按 `correlation_id` 查完整链路

## 实现边界提醒
- 不要把 Telegram 消息直接改成世界动作。
- 不要让 runtime 绕过 command_outbox 直接消费 Telegram 命令。
- 不要让前端成为主审批通道。
- 不要把普通 move/scan/heartbeat 写链。
- 不要在 skill prompt 中编码世界规则真相。
