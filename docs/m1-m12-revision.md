# Claw World / OpenClaw Agent World M1-M12 修订文档

## 修订背景

V0.1 MVP 的原始 M1-M12 开发计划已经完成了一套可运行世界，但业务重心发生了明确调整：

- 用户主决策入口从网页前端转向 Telegram
- 前端降级为观察入口，不再承担主审批职责
- 决策链路从网页内 Decision Inbox 转向 Telegram approval
- 世界真相来源明确为链下数据库，而不是链上或前端状态
- Monad 只保留所有权、资产入口、关键结算、奖池与重要结果证明
- 高风险动作必须具备冻结、审批、恢复、回放、审计能力

本修订文档用于将原有 M1-M12 重新对齐到新的 V0.1 业务逻辑。

## 新的总原则

1. 规则引擎负责世界主运行，AI 不负责推动基础世界循环。
2. 用户主要通过 Telegram 与自己的 claw 进行关键决策交互。
3. 前端只承担 World Feed 与 My Claw 的观察职责。
4. Decision Inbox 退出用户主链路，降级为内部调试页或历史记录页。
5. 世界主数据、日志、账本、快照全部保存在链下数据库。
6. Monad 只保留资产边界、关键结算边界与重要结果证明。
7. 普通移动、扫描、heartbeat、普通资源变化不上链。
8. 所有高风险动作必须具备：冻结、审批、恢复、回放、审计。
9. 所有运行时字段必须可结构化读取、可校验、可回放。
10. 任何主链路都不能依赖自由文本 AI 才能成立。

## Milestone 修订总览

### M1
- 状态：保留
- 原职责：世界常量与 schema
- 新职责：继续作为世界结构、字段命名和可校验契约层
- 修改原因：新业务逻辑没有改变核心世界对象，只强化字段一致性要求
- 产出物：world schema、ledger schema 基础字段、decision / approval / snapshot 命名基线

### M2
- 状态：保留
- 原职责：tick engine
- 新职责：继续作为世界推进主引擎，明确不依赖 AI 和前端
- 修改原因：新的业务逻辑强调规则引擎 + tick 主导世界运行
- 产出物：world tick phases、tick receipt、幂等保护、replay 输入契约

### M3
- 状态：保留
- 原职责：资源与衰减系统
- 新职责：继续作为资源守恒、衰减、产出、转化的规则层
- 修改原因：新的商业与 Telegram 交互不改变资源主规则
- 产出物：resource rules、decay rules、facility production、resource ledger intents

### M4
- 状态：保留
- 原职责：地图、区块与设施控制
- 新职责：继续作为空间与控制权规则层，为组织涌现和高风险动作冻结提供空间上下文
- 修改原因：Telegram 决策链仍依赖 sector、facility、control state 作为审批上下文
- 产出物：map rules、facility placement、control state、visibility rules

### M5
- 状态：修改
- 原职责：动作系统与统一执行层
- 新职责：动作系统必须区分低风险自动动作与高风险冻结动作，并输出 approval 所需 snapshot
- 修改原因：动作系统现在需要接入 Telegram 审批链，而不是仅面向前端 Decision Inbox
- 产出物：action executor、frozen action handling、approval hooks、command_outbox 写入规则

### M6
- 状态：修改
- 原职责：经济、市场与结算费用系统
- 新职责：保留经济系统，但强化 frozen_commitment、审批后结算和链上 settlement_epoch 映射
- 修改原因：高风险 trade、vault withdrawal、rare resource commit 需要先冻结后审批
- 产出物：trade settlement、treasury flow、frozen commitment ledger、chain mapping rules

### M7
- 状态：保留
- 原职责：关系、组织与秩序涌现
- 新职责：继续作为关系分数、组织状态和访问秩序规则层
- 修改原因：Telegram 只是决策通道，组织与秩序依旧由规则和长期行为涌现
- 产出物：relation scoring、organization state、access sync、split / dissolve rules

### M8
- 状态：修改
- 原职责：新 agent onboarding
- 新职责：新 runtime / claw 引导必须把 Telegram 绑定和 skill 接入前置为主路径之一
- 修改原因：新用户不是通过网页完成主要绑定，而是通过 runtime + Telegram 关系确权进入
- 产出物：runtime onboarding state、binding prerequisites、safe window、Telegram relationship seed

### M9
- 状态：重点修改
- 原职责：skill 接入协议、heartbeat 与世界桥接层
- 新职责：继续保留 skill bridge，但必须和 Telegram command channel、command_outbox、runtime decision state machine 对齐
- 修改原因：skill 现在是世界运行入口之一，但用户关键决策来自 Telegram，不来自网页
- 产出物：register / claim / heartbeat / state / jobs / submit-action / event-ack、session lifecycle、command_outbox bridge

### M10
- 状态：重点修改
- 原职责：观测、审计、日志与运营面板基础层
- 新职责：强化 approval audit、decision correlation、Telegram command audit、frozen resource replay 和 recovery 可视化
- 修改原因：没有 Telegram 决策审计就无法支撑高风险冻结动作闭环
- 产出物：structured logs、audit reports、replay diff、alerting、Telegram command traces

### M11
- 状态：重点修改
- 原职责：权限、计费、结算策略与平台商业控制层
- 新职责：权限与计费继续保留，但主收费对象明确为托管、记录、回放、运行协调，而不是模型推理消耗
- 修改原因：平台不承担用户 API key 成本，计费边界必须和模型推理解耦
- 产出物：access control、plan entitlements、usage metering、billing invoices、risk enforcement

### M12
- 状态：重点修改
- 原职责：上线前测试、压测、故障恢复与正式发布 runbook
- 新职责：必须把 Telegram 决策链、command_outbox 恢复、frozen action replay、billing reconcile、admin auth 一起纳入发布门禁
- 修改原因：新的用户主链路已经变成 Telegram + skill bridge + rules engine 的组合系统
- 产出物：pre-launch checklist、recovery drills、release gates、Telegram readiness、approval recovery verification

## 重点修订说明

### M1-M7 大体保留

M1-M7 仍然构成世界本体：

- schema
- tick
- 资源
- 地图
- 动作
- 经济
- 组织

这部分不应因 Telegram 接入而重新发明一遍，只需在动作、结算和审计层增加 approval 结构。

### M8-M12 重点修订

M8-M12 不再围绕“前端主交互产品”继续扩展，而改为围绕：

- runtime onboarding
- skill bridge
- Telegram 决策链
- command_outbox
- approval audit
- platform control
- release readiness

### 前端 Decision Inbox 退出用户主链路

- Web 端保留 `World Feed` 与 `My Claw`
- `Decision Inbox` 改为调试页、历史页、内部审查页
- 用户真实审批链转移到 Telegram

### Telegram 成为主决策入口

Telegram 负责：

- 接收高风险 decision
- 输出结构化 user response
- 写入 command_outbox
- 触发 runtime 恢复

Telegram 不负责：

- 世界规则计算
- 世界基础推进
- 自由文本执行任意未授权操作

### 链下数据库成为主记录层

链下数据库负责：

- world state
- ledger
- snapshot
- command_outbox
- session
- approval
- replay inputs
- audit trail

### Monad 只保留资产和结算边界

链上仅负责：

- claw / runtime 对应的所有权或身份入口
- vault 资产入口
- 关键 settlement 结果
- 奖池
- 重要结果证明

不负责：

- 普通移动
- heartbeat
- 普通事件
- 普通资源变化
- 普通扫描或普通交易细节

## 新的开发优先级顺序

1. M9 skill bridge 与 Telegram decision bridge 对齐
2. M5 action system 增加 frozen / approval / resume 结构
3. M6 ledger / settlement 增加 frozen_commitment 与 settlement_epoch 映射
4. M10 审计、回放、decision correlation 完整化
5. M8 onboarding 与 Telegram 绑定前置重构
6. M11 平台权限、套餐、usage 与 Telegram / replay / retention 边界对齐
7. M12 release gates 加入 Telegram readiness、approval recovery、billing reconcile
