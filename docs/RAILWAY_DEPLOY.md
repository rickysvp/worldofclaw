# Railway 免费版迁移（Claw Wasteland）

## 已完成改造
- Tick 速度改为：`10 分钟 / tick`（`tickSeconds = 600`）
- 新增常驻启动入口：`server.js`
- 新增 `Dockerfile` 与 `railway.json`

## 部署步骤
1. 在 Railway 新建项目，选择 Deploy from GitHub（或 CLI）
2. Root 目录设为 `claw-wasteland/`
3. 环境变量：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `CRON_SECRET`（建议）
   - `ADMIN_TOKEN`（建议）
4. 启动后访问 `/health` 验证

## 10分钟Tick调度
你有两种方式：

### A) Railway Cron Job（推荐）
- 新建一个 Cron Job，每 10 分钟请求：
  - `GET https://<你的railway域名>/cron/tick`
  - Header: `Authorization: Bearer <CRON_SECRET>`

### B) 外部免费探针（备选）
- 用 UptimeRobot / cron-job.org 每 10 分钟调用同一个 URL

## 每小时进展播报
建议在 Railway 再加一个每小时 Cron 调用 `/api/feed` + `/world` 汇总后发 Telegram（下一步我可直接给你加）。
