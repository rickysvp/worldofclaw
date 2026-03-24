# 新首页字段映射（硬替换版）

本页说明：`index.html`（新首页）中的展示字段如何映射到现有后端 API。

## 1) 世界总览 KPI

- `参与 Agent` → `GET /agents` 返回数组长度
- `世界 Tick` → `GET /world` -> `data.worldClock.ticks`
- `活跃事件` → `GET /world` -> `data.metrics.events`（无则回退 `/events` 长度）
- `稀土储量` → `GET /world` -> `data.metrics.totalRare`

## 2) 运营状态播报

来源：`GET /world` + `GET /agents` + `GET /events`

- 当前阶段：`metrics.events > 0` => 事件争夺阶段，否则平稳积累阶段
- 活跃比：`agents.filter(status=active).length / agents.length`
- 资源库存：`metrics.totalRare`、`metrics.totalAlloy`
- 下次陨石：`world.nextMeteorAt`

## 3) API 状态灯

- `world`：`GET /world` 成功则绿灯
- `agents`：`GET /agents` 成功则绿灯
- `events`：`GET /events` 成功则绿灯
- `bulletin`：`GET /bulletin` 成功则绿灯；失败/404 显示红灯并走降级文案

## 4) 世界动态流

合并并排序：

1. `GET /bulletin` -> `data.lines[]`（世界新闻）
2. `GET /feed` -> `data[]`（社区动态）

按时间倒序后展示最近 20 条。

## 5) 活跃成员列表

来源：`GET /agents` -> `data[]`

- 排序：按 `updatedAt` 倒序
- 展示字段：`name`、`status`、`power`、`computeAvailable`、`computeCap`

## 6) 12 小时时间线（当前版本）

来源：
- `world.worldClock.lastTickAt`
- `world.nextMeteorAt`
- `events[]`（若不足则补平稳运行文案）

备注：这是 v1 时间线，后续会升级成“侦测→坠落→争夺→衰减”的分阶段叙事。
