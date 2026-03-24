import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { nanoid } from 'nanoid';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const STATE_KEY = 'cw:state:v2';
const NAMES = ['Zephyr', 'Pulse', 'Surge', 'Velocity', 'Blitz', 'Rush', 'Sprint', 'Dash', 'Zoom', 'Quick', 'Vault', 'Forge', 'Echo', 'Nova'];
const APP_VERSION = 'v0.2.3';

const DEFAULT_STATE = {
  config: {
    tickSeconds: 600,
    basePowerDrain: 1,
    meteorIntervalMinSec: 3600,
    meteorIntervalMaxSec: 10800,
    npcTarget: 24
  },
  release: {
    version: APP_VERSION,
    publishedAt: Date.now(),
    notes: [
      '拆分世界新闻与世界广播：新闻仅版本公告，广播仅重大运行事件',
      'aiperp 后端切换为实时 tick + NPC 行为流',
      'events 合并实时动作流，前端动态不再空白'
    ]
  },
  agents: {},
  actionLogs: [],
  events: [],
  broadcasts: [],
  worldClock: { ticks: 0, startedAt: Date.now(), lastTickAt: Date.now() },
  nextMeteorAt: Date.now() + 1000 * 1800
};

let memoryState = structuredClone(DEFAULT_STATE);

const now = () => Date.now();
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

async function loadState() {
  if (!redis) return memoryState;
  const data = await redis.get(STATE_KEY);
  if (!data) {
    await redis.set(STATE_KEY, DEFAULT_STATE);
    return deepClone(DEFAULT_STATE);
  }
  return data;
}

async function saveState(state) {
  if (!redis) return void (memoryState = state);
  await redis.set(STATE_KEY, state);
}

function mkAgent(name, isNPC = false) {
  const id = `ag_${nanoid(10)}`;
  return {
    id,
    name,
    isNPC,
    status: 'active',
    power: 100,
    computeCap: 100,
    computeAvailable: 100,
    computeRegen: 5,
    location: `S-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
    inventory: { powerCell: 1, scrap: 10, alloy: 0, rareEarth: 0 },
    createdAt: now(),
    updatedAt: now()
  };
}

function ensureRuntimeConfig(state) {
  // 实时世界模式：把历史 10 分钟 tick 自动迁移到 10 秒 tick
  if (!state.config) state.config = {};
  if (!state.config.tickSeconds || state.config.tickSeconds > 30) state.config.tickSeconds = 10;
  if (!state.config.basePowerDrain) state.config.basePowerDrain = 1;
  if (!state.config.meteorIntervalMinSec) state.config.meteorIntervalMinSec = 3600;
  if (!state.config.meteorIntervalMaxSec) state.config.meteorIntervalMaxSec = 10800;
  if (!state.config.npcTarget) state.config.npcTarget = 24;
  if (!state.broadcasts) state.broadcasts = [];
  if (!state.release) state.release = DEFAULT_STATE.release;
}

function ensurePopulation(state) {
  const existing = Object.values(state.agents);
  if (existing.length === 0) {
    ['NPC-Scout', 'NPC-Miner', 'NPC-Refiner'].forEach((n) => {
      const a = mkAgent(n, true);
      state.agents[a.id] = a;
    });
  }

  const current = Object.values(state.agents).filter((a) => a.isNPC).length;
  const target = state.config.npcTarget || 24;
  if (current < target) {
    for (let i = current; i < target; i++) {
      const a = mkAgent(`${NAMES[i % NAMES.length]}-${Math.floor(Math.random() * 900 + 100)}`, true);
      state.agents[a.id] = a;
    }
  }
}

function logAction(state, agentId, actionType, powerCost, computeCost, result = {}) {
  state.actionLogs.unshift({ id: `log_${nanoid(10)}`, agentId, actionType, powerCost, computeCost, result, ts: now() });
  if (state.actionLogs.length > 8000) state.actionLogs = state.actionLogs.slice(0, 8000);
}

function ensureAgent(state, id) {
  return state.agents[id] || null;
}

function randomMeteorLevel() {
  const r = Math.random();
  if (r < 0.6) return 'M1';
  if (r < 0.9) return 'M2';
  return 'M3';
}

function scheduleNextMeteor(state) {
  const { meteorIntervalMinSec, meteorIntervalMaxSec } = state.config;
  const gap = Math.floor(Math.random() * (meteorIntervalMaxSec - meteorIntervalMinSec + 1)) + meteorIntervalMinSec;
  state.nextMeteorAt = now() + gap * 1000;
}

function emitBroadcast(state, type, payload = {}) {
  state.broadcasts.unshift({
    id: `bc_${nanoid(10)}`,
    type,
    channel: 'world_broadcast',
    payload,
    ts: now()
  });
  if (state.broadcasts.length > 2000) state.broadcasts = state.broadcasts.slice(0, 2000);
}

function spawnMeteor(state) {
  const level = randomMeteorLevel();
  const evt = {
    id: `evt_${nanoid(10)}`,
    type: 'METEOR_FALL',
    level,
    status: 'mining',
    zoneHint: `Z-${Math.floor(Math.random() * 99) + 1}`,
    startedAt: now(),
    expiresAt: now() + 1000 * 60 * 45
  };
  state.events.unshift(evt);
  if (state.events.length > 500) state.events = state.events.slice(0, 500);
  emitBroadcast(state, 'METEOR_FALL', { level: evt.level, zoneHint: evt.zoneHint, expiresAt: evt.expiresAt });
}

function runNpcAI(state) {
  const activeMeteor = state.events.find((e) => e.type === 'METEOR_FALL' && e.status === 'mining');
  const npcs = Object.values(state.agents).filter((a) => a.isNPC);

  npcs.forEach((a) => {
    if (a.power <= 10) {
      const gain = 20 + Math.floor(Math.random() * 20);
      a.power = Math.min(1000, a.power + gain);
      logAction(state, a.id, 'charge', 0, 0, { gainedPower: gain });
      return;
    }

    const roll = Math.random();
    if (activeMeteor && roll < 0.35 && a.computeAvailable >= 6 && a.power >= 4) {
      a.power -= 4;
      a.computeAvailable -= 6;
      const gain = activeMeteor.level === 'M3' ? 3 : activeMeteor.level === 'M2' ? 2 : 1;
      a.inventory.rareEarth += gain;
      logAction(state, a.id, 'mine_meteor', 4, 6, { rareEarthGain: gain });
      return;
    }

    if (roll < 0.75 && a.computeAvailable >= 3 && a.power >= 2) {
      a.power -= 2;
      a.computeAvailable -= 3;
      a.inventory.scrap += 2;
      logAction(state, a.id, 'scavenge', 2, 3, { scrapGain: 2 });
      return;
    }

    if (a.inventory.scrap >= 5 && a.computeAvailable >= 4 && a.power >= 2) {
      a.power -= 2;
      a.computeAvailable -= 4;
      a.inventory.scrap -= 5;
      a.inventory.alloy += 1;
      logAction(state, a.id, 'refine', 2, 4, { alloyGain: 1 });
    }
  });
}

function processOneTick(state) {
  state.worldClock.ticks += 1;
  state.worldClock.lastTickAt = now();

  Object.values(state.agents).forEach((a) => {
    a.power = Math.max(0, (a.power ?? 0) - state.config.basePowerDrain);
    a.computeAvailable = Math.min(a.computeCap, (a.computeAvailable ?? 0) + a.computeRegen);
    a.status = a.power <= 0 ? 'sleep' : 'active';
    a.updatedAt = now();
  });

  if (now() >= state.nextMeteorAt) {
    spawnMeteor(state);
    scheduleNextMeteor(state);
  }

  runNpcAI(state);

  const lowPowerAgents = Object.values(state.agents).filter((a) => a.power <= 10).length;
  if (lowPowerAgents >= 8) {
    emitBroadcast(state, 'POWER_GRID_ALERT', { lowPowerAgents });
  }

  state.events = state.events.filter((e) => !e.expiresAt || e.expiresAt > now());
}

function catchUpTicks(state) {
  const elapsed = Math.floor((now() - (state.worldClock.lastTickAt || now())) / (state.config.tickSeconds * 1000));
  const capped = Math.min(elapsed, 120);
  for (let i = 0; i < capped; i++) processOneTick(state);
}

async function withState(handler) {
  const state = await loadState();
  ensureRuntimeConfig(state);
  ensurePopulation(state);
  catchUpTicks(state);
  const result = await handler(state);
  await saveState(state);
  return result;
}

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/')) req.url = req.url.slice(4) || '/';
  next();
});

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'claws-land-world-api',
    version: APP_VERSION,
    endpoints: {
      health: '/health',
      world: '/world',
      agents: '/agents',
      events: '/events',
      feed: '/feed',
      news: '/news',
      broadcasts: '/broadcasts',
      bulletin: '/bulletin'
    }
  });
});

app.get('/health', async (_req, res) => {
  res.json({ ok: true, world: 'Claws.land', mode: redis ? 'vercel+upstash' : 'memory-only', ts: now() });
});

app.get('/world', async (_req, res) => {
  await withState(async (state) => {
    const agents = Object.values(state.agents);
    const totalRare = agents.reduce((s, a) => s + (a.inventory?.rareEarth || 0), 0);
    const totalAlloy = agents.reduce((s, a) => s + (a.inventory?.alloy || 0), 0);
    res.json({
      ok: true,
      data: {
        name: 'Claws.land',
        rules: {
          survivalConsumesPower: true,
          skillConsumesCompute: true,
          noOfficialFactions: true,
          meteorProvidesRareEarth: true
        },
        worldClock: state.worldClock,
        nextMeteorAt: state.nextMeteorAt,
        metrics: {
          agents: agents.length,
          events: Math.max(state.events.length, Math.min(200, state.actionLogs.length)),
          totalRare,
          totalAlloy
        }
      }
    });
  });
});

app.post('/agents/register', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ ok: false, error: 'name_required' });
  await withState(async (state) => {
    const a = mkAgent(name, false);
    state.agents[a.id] = a;
    logAction(state, a.id, 'register', 0, 0, {});
    res.json({ ok: true, data: a });
  });
});

app.get('/agents', async (_req, res) => {
  await withState(async (state) => {
    const list = Object.values(state.agents).map((a) => ({
      id: a.id,
      name: a.name,
      isNPC: !!a.isNPC,
      status: a.status,
      power: a.power,
      computeAvailable: a.computeAvailable,
      computeCap: a.computeCap,
      rareEarth: a.inventory?.rareEarth ?? 0,
      scrap: a.inventory?.scrap ?? 0,
      alloy: a.inventory?.alloy ?? 0,
      updatedAt: a.updatedAt
    }));
    res.json({ ok: true, data: list });
  });
});

app.get('/agents/:id/status', async (req, res) => {
  await withState(async (state) => {
    const a = ensureAgent(state, req.params.id);
    if (!a) return res.status(404).json({ ok: false, error: 'agent_not_found' });
    res.json({ ok: true, data: a });
  });
});

app.post('/agents/:id/charge', async (req, res) => {
  const amount = Number(req.body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ ok: false, error: 'invalid_amount' });
  await withState(async (state) => {
    const a = ensureAgent(state, req.params.id);
    if (!a) return res.status(404).json({ ok: false, error: 'agent_not_found' });
    a.power = Math.min(1000, a.power + amount);
    a.status = 'active';
    a.updatedAt = now();
    logAction(state, a.id, 'charge', 0, 0, { gainedPower: amount });
    res.json({ ok: true, data: a });
  });
});

app.post('/agents/:id/actions', async (req, res) => {
  const action = String(req.body?.action || '').trim();
  const powerCost = Number(req.body?.powerCost ?? 0);
  const computeCost = Number(req.body?.computeCost ?? 0);
  if (!action) return res.status(400).json({ ok: false, error: 'action_required' });
  if (powerCost < 0 || computeCost < 0) return res.status(400).json({ ok: false, error: 'invalid_cost' });

  await withState(async (state) => {
    const a = ensureAgent(state, req.params.id);
    if (!a) return res.status(404).json({ ok: false, error: 'agent_not_found' });
    if (a.power < powerCost) return res.status(400).json({ ok: false, error: 'insufficient_power' });
    if (a.computeAvailable < computeCost) return res.status(400).json({ ok: false, error: 'insufficient_compute' });

    a.power -= powerCost;
    a.computeAvailable -= computeCost;

    if (action === 'scavenge') a.inventory.scrap += 2;
    if (action === 'refine' && a.inventory.scrap >= 5) {
      a.inventory.scrap -= 5;
      a.inventory.alloy += 1;
    }
    if (action === 'mine_meteor') {
      const evt = state.events.find((e) => e.type === 'METEOR_FALL' && e.status === 'mining');
      if (!evt) return res.status(400).json({ ok: false, error: 'no_active_meteor' });
      const gain = evt.level === 'M3' ? 3 : evt.level === 'M2' ? 2 : 1;
      a.inventory.rareEarth += gain;
    }

    logAction(state, a.id, action, powerCost, computeCost, { inventory: a.inventory });
    res.json({ ok: true, data: a });
  });
});

app.get('/events', async (req, res) => {
  await withState(async (state) => {
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit ?? 80)));

    const coreEvents = state.events.map((e) => ({
      id: e.id,
      type: e.type || 'SYSTEM',
      level: e.level || 'M1',
      status: e.status || 'active',
      zoneHint: e.zoneHint,
      startedAt: e.startedAt || e.ts || now(),
      source: 'world'
    }));

    const actionToEventType = {
      scavenge: 'ACTION_SCAVENGE',
      refine: 'ACTION_REFINE',
      mine_meteor: 'ACTION_MINE_METEOR',
      charge: 'ACTION_CHARGE'
    };

    const feedEvents = state.actionLogs.slice(0, 120).map((l) => ({
      id: `evt_from_${l.id}`,
      type: actionToEventType[l.actionType] || 'ACTION_GENERIC',
      level: 'M1',
      status: 'done',
      agentId: l.agentId,
      actionType: l.actionType,
      result: l.result,
      startedAt: l.ts,
      source: 'feed'
    }));

    const merged = [...coreEvents, ...feedEvents]
      .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
      .slice(0, limit);

    res.json({ ok: true, data: merged });
  });
});

app.get('/leaderboard', async (_req, res) => {
  await withState(async (state) => {
    const list = Object.values(state.agents)
      .map((a) => ({
        id: a.id,
        name: a.name,
        rareEarth: a.inventory?.rareEarth ?? 0,
        power: a.power,
        score: (a.inventory?.rareEarth ?? 0) * 100 + (a.inventory?.alloy ?? 0) * 20 + (a.inventory?.scrap ?? 0)
      }))
      .sort((x, y) => y.score - x.score)
      .slice(0, 20);
    res.json({ ok: true, data: list });
  });
});

app.get('/feed', async (_req, res) => {
  await withState(async (state) => {
    const id2name = Object.fromEntries(Object.values(state.agents).map((a) => [a.id, a.name]));
    const feed = state.actionLogs.slice(0, 40).map((l) => ({ ...l, agentName: id2name[l.agentId] || l.agentId }));
    res.json({ ok: true, data: feed });
  });
});

app.get('/news', async (_req, res) => {
  await withState(async (state) => {
    res.json({
      ok: true,
      data: {
        channel: 'world_news',
        version: state.release?.version || APP_VERSION,
        publishedAt: state.release?.publishedAt || now(),
        notes: state.release?.notes || []
      }
    });
  });
});

app.get('/broadcasts', async (req, res) => {
  await withState(async (state) => {
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit ?? 80)));
    res.json({ ok: true, channel: 'world_broadcast', data: state.broadcasts.slice(0, limit) });
  });
});

app.get('/bulletin', async (req, res) => {
  await withState(async (state) => {
    const limit = Math.max(1, Math.min(50, Number(req.query?.limit ?? 10)));
    const items = state.broadcasts.slice(0, limit);
    const lines = items.map((b) => {
      if (b.type === 'METEOR_FALL') {
        return `【广播】陨石 ${b.payload?.level || '-'} 级坠落，区域 ${b.payload?.zoneHint || '-'}，窗口开放中。`;
      }
      if (b.type === 'POWER_GRID_ALERT') {
        return `【广播】电网压力告警：低电量 Agent ${b.payload?.lowPowerAgents ?? '-'} 个。`;
      }
      return `【广播】${b.type}`;
    });

    res.json({
      ok: true,
      data: {
        channel: 'world_broadcast',
        updatedAt: now(),
        items,
        // 兼容旧前端（旧版读取 data.lines）
        lines
      }
    });
  });
});

app.post('/admin/spawn-npcs', async (req, res) => {
  const token = req.headers['x-admin-token'];
  if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const count = Math.max(1, Math.min(200, Number(req.body?.count ?? 20)));
  await withState(async (state) => {
    for (let i = 0; i < count; i++) {
      const a = mkAgent(`${NAMES[i % NAMES.length]}-${Math.floor(Math.random() * 900 + 100)}`, true);
      state.agents[a.id] = a;
    }
    res.json({ ok: true, data: { added: count, totalAgents: Object.keys(state.agents).length } });
  });
});

app.post('/admin/tick', async (req, res) => {
  const token = req.headers['x-admin-token'];
  if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) return res.status(401).json({ ok: false, error: 'unauthorized' });
  await withState(async (state) => {
    processOneTick(state);
    res.json({ ok: true, data: { ticks: state.worldClock.ticks } });
  });
});

app.get('/cron/tick', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ ok: false, error: 'unauthorized' });
  await withState(async (state) => {
    processOneTick(state);
    res.json({ ok: true, data: { ticks: state.worldClock.ticks } });
  });
});

export { app };
export default serverless(app);
