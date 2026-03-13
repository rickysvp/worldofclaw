# Claw World 前端重设计交接文档

## 目标

这份文档用于把当前 `apps/web` 的最小前端入口交接给新的设计/实现者，方便直接推倒重做首页和整体信息架构，同时保留现有运行壳、路由结构和 mock 数据参考。

当前结论：

- 前端工程壳可继续使用
- 当前首页与部分页面的视觉/排版质量不达标
- 建议保留基础工程，重做页面结构和大部分业务组件

## 当前前端位置

- 应用目录：`/Users/ricky/AICode/WorldofClaw/apps/web`
- 运行方式：
  - `npm run dev:web`
  - `npm run build:web`

## 建议保留的基础文件

这些文件属于前端工程壳，不建议重做：

- `/Users/ricky/AICode/WorldofClaw/apps/web/package.json`
- `/Users/ricky/AICode/WorldofClaw/apps/web/tsconfig.json`
- `/Users/ricky/AICode/WorldofClaw/apps/web/next.config.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/postcss.config.js`
- `/Users/ricky/AICode/WorldofClaw/apps/web/tailwind.config.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/layout.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/globals.css`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/not-found.tsx`

## 建议重做的页面

这些页面是当前 mock 交互层，建议直接重做：

- `/Users/ricky/AICode/WorldofClaw/apps/web/app/page.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/world/page.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/my-claw/page.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/inbox/page.tsx`

## 当前 mock API 路由

这些路由当前全部依赖本地 mock 数据，不连接真实 world / bridge：

- `/Users/ricky/AICode/WorldofClaw/apps/web/app/api/world-feed/route.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/api/my-claw/route.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/api/decision-cards/route.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/api/status/route.ts`

建议：

- 第一阶段继续保留 mock API，先完成新 UI
- 第二阶段再替换为真实 `services/api` / `services/admin` 数据源

## 当前组件层

当前组件多数是旧 mock 结构，建议不要逐个修补，直接按新设计拆新组件：

- `/Users/ricky/AICode/WorldofClaw/apps/web/components/ClawStatusCard.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/DecisionCard.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/DecisionDrawer.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/EmptyState.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/EventTag.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/FeedItem.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/FeedList.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/InventoryCard.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/ObjectiveCard.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/RiskBadge.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/SectionHeader.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/Sidebar.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/components/Topbar.tsx`

建议保留参考价值较高的轻组件：

- `RiskBadge`
- `EventTag`

## 当前 mock 数据与类型

核心 mock 数据都在这里：

- `/Users/ricky/AICode/WorldofClaw/apps/web/lib/mock-data.ts`

当前类型定义在这里：

- `/Users/ricky/AICode/WorldofClaw/apps/web/lib/types.ts`

辅助文件：

- `/Users/ricky/AICode/WorldofClaw/apps/web/lib/constants.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/lib/format.ts`

建议：

- `types.ts` 保留作为 UI 数据契约参考
- `mock-data.ts` 建议整体重写，不继续基于旧首页结构修补

## 当前问题总结

### 结构问题

- 首页信息密度过高
- 首页层级不清晰
- 首页更像拼接的控制台，而不是世界入口
- 首屏没有立住产品感和世界感

### 视觉问题

- 边框过多
- 模块节奏太碎
- 留白不足
- 英雄区不够强
- 信息块之间缺少呼吸感

### 产品表达问题

- “我是人类 / 我是 AI” 入口之前不清晰
- 世界状态、世界 feed、关键个体、下一步动作混在一起
- mock 登录表达过于轻率，不适合作为真实产品入口语义

## 新设计建议

建议按下面顺序重做：

### 首页 `/`

推荐改成四段式：

1. Hero 世界宣言 + 双入口
2. 世界状态总览 + Top Claws / Top Organizations
3. 模块化世界 feed
4. 下一步行动入口

### `/world`

保留为更深入的事件观察页，但应减少 dashboard 味道，增强“世界直播感”

### `/my-claw`

强化成真正的人类控制台，重点回答：

- 它现在在哪
- 它在做什么
- 它安不安全
- 它缺什么
- 我现在最值得干预什么

### `/inbox`

继续保留为决策审批页，但视觉上应更像“待审批事项”，不是普通卡片列表

## 与真实系统接线的后续方向

当前前端全部走 mock。后续可以按这个顺序接真实系统：

1. `world status`
2. `my claw state`
3. `decision cards`
4. `session / heartbeat status`
5. `real skill bridge / admin feed`

## 当前可安全清理的非源码产物

这些不属于需要交给新设计者的源码：

- `/Users/ricky/AICode/WorldofClaw/apps/web/.next`
- `/Users/ricky/AICode/WorldofClaw/apps/web/.next.stale.*`
- `/Users/ricky/AICode/WorldofClaw/apps/web/.vercel`
- `/Users/ricky/AICode/WorldofClaw/apps/web/node_modules`
- `/Users/ricky/AICode/WorldofClaw/.playwright-cli`
- `/Users/ricky/AICode/WorldofClaw/apps/web/.gitignore`（若只是 Vercel CLI 生成）

## 给新 AI 的最小交接包

如果要交给另一个 AI，优先给这些文件：

- `/Users/ricky/AICode/WorldofClaw/apps/web/app/page.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/world/page.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/my-claw/page.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/inbox/page.tsx`
- `/Users/ricky/AICode/WorldofClaw/apps/web/lib/mock-data.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/lib/types.ts`
- `/Users/ricky/AICode/WorldofClaw/apps/web/app/globals.css`
- `/Users/ricky/AICode/WorldofClaw/apps/web/tailwind.config.ts`

这就足够让新 AI 重做前端，而不用卷入整个 M1-M12 系统实现细节。
