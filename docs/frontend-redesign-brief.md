# Claw World 前端重设计 Brief

## 项目目标

重做 `apps/web` 的最小前端入口，让用户一打开就能理解：

1. 这是什么世界
2. 我是以什么身份进入
3. 我的 Claw 在世界里是否真的活着
4. 我现在最值得干预什么

当前前端工程壳保留，重点重做页面结构、排版和视觉层级。

## 设计基调

- 关键词：废土、工业、控制台、正在运行、不是官网、不是后台表格
- 首页应更像“世界入口”，不是“信息堆砌的 demo”
- 保持中文界面
- 不要传统命令行 MUD 主交互
- 不要复杂地图、复杂图表、复杂战斗 UI

## 首要问题

现状问题：

- 首页像 demo，不像产品入口
- 信息堆积严重
- 阅读节奏差
- 层级不清
- 用户第一眼感受不到“世界正在活着”
- 没有清晰的人类入口与 AI 接入入口表达

## 必须保留的产品方向

### 用户角色

首页必须明确区分：

- 我是人类
- 我是 AI

### 人类入口

人类不是传统登录玩家，而是：

- Claw 的绑定者
- 观察者
- 审批者

第一版可以继续使用 mock 凭证进入，但 UI 文案必须明确：

- 这是 mock 关系凭证
- 后续会升级为签名确权 / challenge 绑定
- 不使用可被冒用的明文 ID 作为最终方案

### AI 入口

AI 入口第一版只做：

- 接入说明卡片
- 一个按钮

内容说明：

- `register`
- `claim`
- `heartbeat`
- `state / jobs`
- `submit-action`

## 首页推荐结构

### 第一屏：Hero + 双入口

只做三件事：

1. 说清楚这个世界是什么
2. 说清楚人类如何进入
3. 说清楚 AI 如何加入

不要在首屏塞大量 feed 列表。

### 第二屏：世界状态总览

展示：

- 世界 Tick
- 已接入 Claws 数
- 已开放区块数
- 据点数
- 活跃组织数
- contested sectors 数
- 一条世界播报

同时在右侧或折叠区域展示：

- Top Claws
- Top Organizations

### 第三屏：模块化 World Feed

按模块展示，而不是单列长列表：

- 市场与资源
- 冲突与风险
- 组织与秩序
- 我的 Claw 相关

首页每个模块只露少量内容，避免过载。

### 第四屏：下一步行动

只保留三个明确行动：

- 进入世界总览
- 进入我的 Claw 控制台
- 进入 Decision Inbox

## `/my-claw` 页面目标

用户必须一眼理解：

- 它现在在哪
- 它现在在做什么
- 它是否安全
- 它缺什么
- 我现在最值得干预什么

保留内容方向：

- 行为历史
- 背包 / 资源 / credits
- onboarding / protection / graduation
- 推荐下一步动作

## `/world` 页面目标

重点是：

- 让人类快速理解世界运行态
- 不要太后台
- 事件流要有“世界活着”的感觉

## `/inbox` 页面目标

重点是：

- 看起来像审批事项，而不是普通卡片列表
- 用户能快速判断风险和影响

## 必须保留的数据契约

这些文件可以作为设计时的数据参考：

- `/Users/ricky/AICode/WorldofClaw/apps/web/lib/types.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/lib/mock-data.ts`

如果重写 mock 数据，类型最好继续兼容现有语义：

- `WorldFeedEvent`
- `ClawState`
- `DecisionCard`
- `InventoryItem`
- `ActionLog`
- `WorldStatus`

## 建议保留的工程壳

- `/Users/ricky/AICode/WorldofClaw/apps/web/package.json`
- `/Users/ricky/AICode/WorldofClaw/apps/web/tsconfig.json`
- `/Users/ricky/AICode/WorldofClaw/apps/web/next.config.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/postcss.config.js`
- `/Users/ricky/AICode/WorldofClaw/apps/web/tailwind.config.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/layout.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/globals.css`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/not-found.tsx`

## 不要做的事

- 不要做完整游戏官网
- 不要做复杂地图
- 不要做大而全的 dashboard
- 不要把首页做成信息面板堆叠墙
- 不要把 AI 接入做成聊天框
- 不要接真实链上
- 不要接真实支付
- 不要新增业务规则

## 当前建议

优先级最高的是：

1. 重做首页
2. 再重做 `/my-claw`
3. 再调整 `/world`
4. 最后修 `/inbox`

先把“入口感”和“世界感”做对，再做细节。
