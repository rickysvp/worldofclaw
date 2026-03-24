import { app } from './api/index.js';

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

app.listen(port, host, () => {
  console.log(`[Claw Wasteland] Railway server running on ${host}:${port}`);
});

// Railway 常驻进程：每10分钟触发一次 tick（与你的世界规则一致）
const cronSecret = process.env.CRON_SECRET || '';
setInterval(async () => {
  try {
    const url = `http://127.0.0.1:${port}/cron/tick`;
    await fetch(url, {
      headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}
    });
  } catch (e) {
    console.error('[TickLoop] failed:', e?.message || e);
  }
}, 10 * 60 * 1000);
