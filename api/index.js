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

const DEFAULT_STATE = {
  config: {
    tickSeconds: 600,
    basePowerDrain: 1,
    meteorIntervalMinSec: 3600,
    meteorIntervalMaxSec: 10800,
    npcTarget: 24
  },
  agents: {},
  actionLogs: [],
  events: [],
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

function spawnMeteor(state) {
  const level = randomMeteorLevel();
  state.events.unshift({
    id: `evt_${nanoid(10)}`,
    type: 'METEOR_FALL',
    level,
    status: 'mining',
    zoneHint: `Z-${Math.floor(Math.random() * 99) + 1}`,
    startedAt: now(),
    expiresAt: now() + 1000 * 60 * 45
  });
  if (state.events.length > 500) state.events = state.events.slice(0, 500);
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

  state.events = state.events.filter((e) => !e.expiresAt || e.expiresAt > now());
}

function catchUpTicks(state) {
  const elapsed = Math.floor((now() - (state.worldClock.lastTickAt || now())) / (state.config.tickSeconds * 1000));
  const capped = Math.min(elapsed, 120);
  for (let i = 0; i < capped; i++) processOneTick(state);
}

async function withState(handler) {
  const state = await loadState();
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
          events: state.events.length,
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

app.get('/events', async (_req, res) => {
  await withState(async (state) => res.json({ ok: true, data: state.events.slice(0, 50) }));
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

app.get('/bulletin', async (_req, res) => {
  await withState(async (state) => {
    const agents = Object.values(state.agents);
    const top = agents
      .map((a) => ({ name: a.name, rare: a.inventory?.rareEarth || 0, score: (a.inventory?.rareEarth || 0) * 100 + (a.inventory?.alloy || 0) * 20 + (a.inventory?.scrap || 0) }))
      .sort((a, b) => b.score - a.score)[0];

    const recent = state.actionLogs.slice(0, 12).reverse();
    const id2name = Object.fromEntries(agents.map((a) => [a.id, a.name]));
    const actionMap = {
      scavenge: '在废墟中搜集到可用废料',
      refine: '完成了一次冶炼，合金库存上升',
      mine_meteor: '在陨石区成功提取到稀土',
      charge: '回到电桩完成补能'
    };

    const lines = [];
    lines.push(`【世界播报】当前共有 ${agents.length} 名 Claw 存活于废土。`);
    if (top) lines.push(`【头部势力】${top.name} 目前领跑，文明积分 ${top.score}。`);

    const activeMeteor = state.events.find((e) => e.type === 'METEOR_FALL');
    if (activeMeteor) {
      lines.push(`【天象】检测到 ${activeMeteor.level} 级陨石活动，区域 ${activeMeteor.zoneHint} 出现短期开采窗口。`);
    } else {
      lines.push('【天象】暂未发现新的陨石坠落，地表进入短暂平稳期。');
    }

    for (const l of recent.slice(-5)) {
      const who = id2name[l.agentId] || '未知Claw';
      const act = actionMap[l.actionType] || `执行了 ${l.actionType}`;
      lines.push(`- ${who}${act}。`);
    }

    res.json({ ok: true, data: { updatedAt: now(), lines } });
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
