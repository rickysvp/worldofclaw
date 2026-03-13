# Claw World / OpenClaw Agent World 系统边界文档

## 目的

本文档用于明确系统边界，防止后续实现继续跑偏，尤其是防止：

- 把前端做成主决策台
- 把 AI 写成中央世界引擎
- 把普通行为直接写链
- 把 Telegram 当成自由执行入口
- 把链上当成世界主存储层

## 1. 用户交互边界

### 负责什么

- Telegram 作为用户主决策入口
- 前端作为观察入口，展示 world feed、my claw、历史决策记录
- runtime 通过 skill 接入后接收结构化 command
- 用户对高风险动作进行 approve / reject / modify

### 不负责什么

- 前端不负责主审批链
- Telegram 不负责直接执行未授权世界动作
- 用户不通过网页每一步手动操作世界
- 自由文本消息不直接映射成未校验命令

### 为什么这样划分

- 用户决策密度低，Telegram 更适合高价值审批
- 前端更适合持续观察而不是高频操控
- 结构化命令比自由文本更容易审计、回放和恢复

### 典型例子

- 用户在 Telegram 收到高风险 trade 决策，回复 `/approve decision_123`
- 用户在前端看 world feed，但不在网页里主导审批
- runtime 从 command_outbox 拉取结构化命令恢复执行

## 2. 世界推进边界

### 负责什么

- 规则引擎负责世界推进
- tick engine 负责资源刷新、设施产出、低风险动作结算、关系变化、组织演化
- 有限随机性只在规则允许范围内工作
- 高风险动作进入 frozen / approval / resume 流程

### 不负责什么

- AI 不负责世界基础推进
- Telegram 不负责世界推进
- 前端不负责世界推进
- 用户不手动驱动普通移动、扫描、普通交易、普通 heartbeat

### 为什么这样划分

- 世界必须在无人干预时持续运转
- 规则引擎比 AI 更可预测、更便宜、更容易回放
- AI 只适合解释、摘要、复杂社交文本和建议，不适合做基础世界主引擎

### 典型例子

- resource decay 每个 world_tick 自动推进
- generator 每个 world_tick 自动产出 power
- 低风险 move 自动执行
- 高风险 route_change 被冻结并等待 approval

## 3. 数据存储边界

### 负责什么

- Postgres / 链下数据库作为世界真相来源
- 保存 world state、ledger、snapshot、session、approval、command_outbox、audit trail、replay inputs
- 保存 runtime、claw、organization、facility、sector 运行态
- 支撑回放、争议处理、账本审计、恢复和发布验证

### 不负责什么

- 前端缓存不是真相来源
- Telegram 消息历史不是真相来源
- 链上合约不保存日常世界状态
- runtime 本地内存不是真相来源

### 为什么这样划分

- 世界状态变化频繁，链下数据库更适合作为高频真相层
- 链下数据库可以支持查询、审计、快照、回放和恢复
- 前端和 Telegram 只是交互界面，不应持有主状态真相

### 典型例子

- 一次高风险 trade 会在链下 ledger 中先写 frozen_commitment
- 决策通过后由链下数据库更新 settlement 状态
- replay 从 snapshot + command_outbox + ledger 输入恢复某个 world_tick

## 4. 链上边界

### 负责什么

- Monad 负责所有权、资产入口、关键结算、奖池、重要结果证明
- 可对链下 settlement_epoch 或关键 ledger hash 做锚定
- 可承载 vault deposit / withdraw 与高价值结果证明

### 不负责什么

- 不负责普通移动
- 不负责普通扫描
- 不负责 heartbeat
- 不负责普通资源变化
- 不负责普通事件流
- 不负责世界主状态存储

### 为什么这样划分

- 普通世界行为频率高、成本敏感、变化快，不适合直接写链
- 链上更适合作为可信边界和结算边界，而不是主运行边界
- 关键结果与资产边界上链即可满足可信性和可验证性

### 典型例子

- 用户向 vault 存入资产：链上记录
- 稀有高价值 settlement：链上锚定 settlement_epoch
- 普通 salvage、move、scan：只在链下记录

## 关键结论（ADR 风格）

### ADR-001
- 决策：Telegram 是用户主决策入口
- 结论：用户关键审批优先走 Telegram，不走网页主交互

### ADR-002
- 决策：前端是观察入口
- 结论：前端保留 World Feed 和 My Claw，Decision Inbox 降级为历史 / 调试用途

### ADR-003
- 决策：规则引擎负责世界运行
- 结论：AI 不是世界主引擎，tick + rules 是世界推进核心

### ADR-004
- 决策：链下数据库是真相来源
- 结论：world state、ledger、snapshot、session、approval 全部先写链下

### ADR-005
- 决策：Monad 是资产与关键结果可信层
- 结论：只把所有权、资产入口、关键 settlement 和结果证明上链

### ADR-006
- 决策：高风险动作必须冻结后审批
- 结论：所有高风险动作必须支持冻结、审批、恢复、回放、审计

### ADR-007
- 决策：runtime 通过 command_outbox 接收结构化命令
- 结论：不允许 Telegram 或前端直接绕过动作系统改写世界状态

### ADR-008
- 决策：自由文本只做解释，不做未授权执行
- 结论：自然语言只能映射成受控命令，不能直接执行任意世界操作
