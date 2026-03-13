# Claw World Telegram Protocol

## 1. 设计目标
- 用户体验目标：让 user 感觉自己是在和自己的 claw 沟通，而不是在操作一个冷冰冰的后台系统。
- 系统目标：所有 Telegram 消息最终都必须映射为结构化的 decision、approval 或 command_outbox 写入，不允许自然语言直接执行任意未授权操作。
- 产品目标：Telegram 作为主决策入口，前端只负责观察、历史和状态查看。
- 风控目标：所有高风险操作都必须支持绑定校验、幂等、防重放、审计追踪与超时回退。

## 2. 用户体验原则
- 对话主体是 claw：消息以 claw 的口吻汇报状态、请求 approval、反馈结果。
- 交互内容结构化：即使是自然语言描述，也必须附带可点击或可命令化的明确选项。
- 优先摘要，不堆原始日志：状态消息优先给出摘要、风险、推荐方案和下一步。
- 高风险强结构化：高风险 approval 只接受明确命令，不接受模糊自然语言。
- 超时可预期：任何等待 user 的 decision 都必须告诉 user 超时时间和默认回退行为。

## 3. 消息模板

### 3.1 状态汇报
```text
[Claw 状态汇报]
claw: {claw_name}
runtime: {runtime_id}
world_tick: {world_tick}
位置: {sector_name}
当前动作: {current_action}
资源摘要: power={power}, credits={credits}, cargo={cargo_used}/{cargo_max}
风险等级: {risk_level}
建议: {recommended_next_step}
可用命令: /status /world /inbox
```

### 3.2 高风险决策请求
```text
[需要你的 approval]
decision_id: {decision_id}
类型: {decision_type_label}
claw: {claw_name}
原因: {reason_summary}
风险: {risk_level}
影响资源: {affected_resources}
位置: {affected_location}
推荐: {recommended_option}
超时: {timeout_seconds}s
超时处理: {timeout_behavior}
可执行命令:
/approve {decision_id}
/reject {decision_id}
/modify {decision_id} quantity <value>
/modify {decision_id} budget_cap <value>
/modify {decision_id} route_risk <value>
```

### 3.3 建议选项
```text
[Claw 建议]
decision_id: {decision_id}
推荐方案: {recommended_option}
理由:
1. {reason_1}
2. {reason_2}
3. {reason_3}
```

### 3.4 用户确认结果
```text
[已记录你的决定]
decision_id: {decision_id}
approval: {approval_result}
修改项: {approval_patch_summary}
correlation_id: {correlation_id}
下一步: command_outbox 已生成，等待 runtime 拉取执行
```

### 3.5 超时提醒
```text
[决策即将过期]
decision_id: {decision_id}
剩余时间: {remaining_seconds}s
默认处理: {timeout_behavior}
如果你要覆盖默认策略，请立即发送命令。
```

### 3.6 执行结果回报
```text
[Claw 执行回报]
decision_id: {decision_id}
command_id: {command_id}
结果: {result_status}
world_tick: {world_tick}
摘要: {result_summary}
账本记录: {ledger_entry_refs}
```

## 4. 命令映射规则

### 4.1 命令列表
- `/status`
- `/approve <decision_id>`
- `/reject <decision_id>`
- `/modify <decision_id> quantity <value>`
- `/modify <decision_id> budget_cap <value>`
- `/modify <decision_id> route_risk <value>`

### 4.2 结构化映射

#### `/status`
映射为：
```yaml
command_type: request_runtime_status
arguments:
  runtime_scope: bound_runtime_only
```

#### `/approve <decision_id>`
映射为：
```yaml
command_type: approval_response
arguments:
  decision_id: <decision_id>
  approval: approve
```

#### `/reject <decision_id>`
映射为：
```yaml
command_type: approval_response
arguments:
  decision_id: <decision_id>
  approval: reject
```

#### `/modify <decision_id> quantity <value>`
映射为：
```yaml
command_type: approval_response
arguments:
  decision_id: <decision_id>
  approval: modified
  patch:
    quantity: <value>
```

#### `/modify <decision_id> budget_cap <value>`
映射为：
```yaml
command_type: approval_response
arguments:
  decision_id: <decision_id>
  approval: modified
  patch:
    budget_cap: <value>
```

#### `/modify <decision_id> route_risk <value>`
映射为：
```yaml
command_type: approval_response
arguments:
  decision_id: <decision_id>
  approval: modified
  patch:
    route_risk: <value>
```

### 4.3 命令接受规则
- 未绑定 chat_id 的消息不进入 command_outbox。
- command 必须能解析成一个唯一的 decision 或 runtime 目标。
- 对于不支持的字段修改，系统返回结构化错误，不做近似猜测。
- 同一 decision 的终局命令只接受一次有效写入，其余按幂等规则返回既有结果。

## 5. 安全边界

### 5.1 Telegram 绑定关系
- 一个 `chat_id` 必须先绑定一个 `user`，再映射到该 user 有权操作的 `runtime`。
- 绑定关系必须保存在链下数据库，不能只依赖 Telegram 用户名。
- 一个 `chat_id` 默认只允许操作其已绑定的 runtime 集合。

### 5.2 runtime 操作范围
- `chat_id` 只能操作与该 user 绑定的 runtime。
- `decision_id` 所属校验必须检查：
  - `decision.runtime_id`
  - `decision.user_id`
  - `binding.chat_id`
- 不允许跨 runtime、跨 user 审批。

### 5.3 幂等校验
- 每条 Telegram 命令进入系统后都要生成 `idempotency_key`。
- `idempotency_key` 建议格式：`telegram:{chat_id}:{message_id}:{command_type}`。
- 相同 `idempotency_key` 的重复消息必须返回已有处理结果，不重复写 command_outbox。

### 5.4 重复消息保护
- Telegram 可能重发 webhook 或用户重复发送命令。
- 系统必须根据 `chat_id + message_id + parsed_command_hash` 去重。
- 去重结果必须可审计。

### 5.5 命令审计要求
每次命令处理必须写入审计记录，至少包含：
- `chat_id`
- `user_id`
- `runtime_id`
- `decision_id`
- `message_id`
- `parsed_command`
- `approval`
- `idempotency_key`
- `correlation_id`
- `created_at`
- `result_status`

## 6. 错误处理

### 6.1 错误返回原则
- 对 user：给出简短、明确、可恢复的错误提示。
- 对系统：写结构化错误日志和命令审计记录。

### 6.2 典型错误
- `TELEGRAM_BINDING_NOT_FOUND`
  - 含义：chat_id 未绑定任何 user/runtime。
  - 用户提示：`当前会话未绑定任何 Claw，请先完成绑定。`

- `DECISION_NOT_FOUND`
  - 含义：decision_id 不存在或不可见。
  - 用户提示：`未找到该决策，可能已过期或不属于你的 Claw。`

- `DECISION_ALREADY_FINALIZED`
  - 含义：该 decision 已处理完。
  - 用户提示：`该决策已完成处理，系统已忽略重复命令。`

- `COMMAND_PATCH_INVALID`
  - 含义：modify 字段不合法。
  - 用户提示：`修改字段无效，仅支持 quantity / budget_cap / route_risk。`

- `COMMAND_OUTBOX_WRITE_FAILED`
  - 含义：系统已解析命令，但写入 command_outbox 失败。
  - 用户提示：`系统暂时未能提交命令，已记录错误，请稍后重试。`

## 7. 示例对话

### 7.1 高风险交易
```text
Claw:
[需要你的 approval]
decision_id: dec_trade_1042
类型: High Value Trade Approval
claw: 灰烬拾荒者-7
原因: Night Wharf 买家请求收购 12 xenite，总额 860 credits
风险: high
影响资源: xenite=12, credits=860
位置: Night Wharf
推荐: reject
超时: 900s
超时处理: reject_and_release_frozen_commitment
可执行命令:
/approve dec_trade_1042
/reject dec_trade_1042
/modify dec_trade_1042 quantity <value>
/modify dec_trade_1042 budget_cap <value>

User:
/modify dec_trade_1042 quantity 6

Claw:
[已记录你的决定]
decision_id: dec_trade_1042
approval: modified
修改项: quantity=6
correlation_id: corr_trade_1042
下一步: command_outbox 已生成，等待 runtime 拉取执行
```

### 7.2 路线切换
```text
Claw:
[需要你的 approval]
decision_id: dec_route_2201
类型: High Risk Route Change
claw: 裂谷行者-2
原因: 原路线前方进入 contested sector，建议改道旧工业遗址
风险: high
影响资源: power=3, time=+2 ticks
位置: Wasteland Route
推荐: approve_alternate_route
超时: 600s
超时处理: keep_original_route

User:
/approve dec_route_2201

Claw:
[Claw 执行回报]
decision_id: dec_route_2201
command_id: cmd_route_2201
结果: delivered
world_tick: 1820
摘要: 已切换到替代路线，预计两 tick 后抵达目标区块
账本记录: led_9902
```

### 7.3 紧急停机覆盖
```text
Claw:
[需要你的 approval]
decision_id: dec_shutdown_77
类型: Emergency Shutdown Override
claw: 黑风-3
原因: runtime 连续两次恢复失败，系统建议保持停机
风险: high
影响资源: 恢复后可能继续损耗 durability
位置: Relay Highland
推荐: reject
超时: 300s
超时处理: preserve_shutdown_and_alert_admin

User:
/approve dec_shutdown_77

Claw:
[已记录你的决定]
decision_id: dec_shutdown_77
approval: approve
修改项: none
correlation_id: corr_shutdown_77
下一步: command_outbox 已生成，等待 runtime 拉取执行
```
