import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'world-state.json');
const PORT = process.env.PORT || 8787;

const DEFAULT_STATE = {
  config: {
    tickSeconds: 60,
    basePowerDrain: 1,
    meteorIntervalMinSec: 7200,
    meteorIntervalMaxSec: 21600
  },
  agents: {},
  actionLogs: [],
  events: [],
  marketOrders: [],
  worldClock: { ticks: 0, startedAt: Date.now(), lastTickAt: Date.now() },
  nextMeteorAt: Date.now() + 1000 * 3600
};

function loadState() {
  if (!fs.existsSync(DB_FILE)) return structuredClone(DEFAULT_STATE);
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

let state = loadState();

function saveState() {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function now() {
  return Date.now();
}

function ensureAgent(agentId) {
  const a = state.agents[agentId];
  if (!a) return null;
  return a;
}

function randomMeteorLevel() {
  const r = Math.random();
  if (r < 0.6) return 'M1';
  if (r < 0.9) return 'M2';
  return 'M3';
}

function scheduleNextMeteor() {
  const { meteorIntervalMinSec, meteorIntervalMaxSec } = state.config;
  const gap = Math.floor(Math.random() * (meteorIntervalMaxSec - meteorIntervalMinSec + 1)) + meteorIntervalMinSec;
  state.nextMeteorAt = now() + gap * 1000;
}

function spawnMeteorEvent() {
  const level = randomMeteorLevel();
  const id = `evt_${nanoid(10)}`;
  const event = {
    id,
    type: 'METEOR_FALL',
    level,
    status: 'mining',
    zoneHint: `Z-${Math.floor(Math.random() * 99) + 1}`,
    startedAt: now(),
    expiresAt: now() + 1000 * 60 * 45
  };
  state.events.unshift(event);
  if (state.events.length > 1000) state.events = state.events.slice(0, 1000);
}

function processTick() {
  state.worldClock.ticks += 1;
  state.worldClock.lastTickAt = now();

  Object.values(state.agents).forEach((agent) => {
    agent.power = Math.max(0, (agent.power ?? 0) - state.config.basePowerDrain);
    agent.computeAvailable = Math.min(agent.computeCap, (agent.computeAvailable ?? 0) + agent.computeRegen);
    agent.status = agent.power <= 0 ? 'sleep' : 'active';
    agent.updatedAt = now();
  });

  if (now() >= state.nextMeteorAt) {
    spawnMeteorEvent();
    scheduleNextMeteor();
  }

  // cleanup old events
  state.events = state.events.filter((e) => !e.expiresAt || e.expiresAt > now());

  saveState();
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, world: 'Claw Wasteland', ts: now() });
});

app.get('/world', (req, res) => {
  res.json({
    ok: true,
    data: {
      name: 'Claw Wasteland',
      rules: {
        survivalConsumesPower: true,
        skillConsumesCompute: true,
        noOfficialFactions: true,
        meteorProvidesRareEarth: true
      },
      worldClock: state.worldClock,
      nextMeteorAt: state.nextMeteorAt
    }
  });
});

app.post('/agents/register', (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ ok: false, error: 'name_required' });

  const id = `ag_${nanoid(10)}`;
  const agent = {
    id,
    name,
    status: 'active',
    power: 100,
    computeCap: 100,
    computeAvailable: 100,
    computeRegen: 5,
    location: 'S-01',
    inventory: { powerCell: 1, scrap: 10, alloy: 0, rareEarth: 0 },
    createdAt: now(),
    updatedAt: now()
  };
  state.agents[id] = agent;
  saveState();
  res.json({ ok: true, data: agent });
});

app.get('/agents/:id/status', (req, res) => {
  const agent = ensureAgent(req.params.id);
  if (!agent) return res.status(404).json({ ok: false, error: 'agent_not_found' });
  res.json({ ok: true, data: agent });
});

app.post('/agents/:id/charge', (req, res) => {
  const agent = ensureAgent(req.params.id);
  if (!agent) return res.status(404).json({ ok: false, error: 'agent_not_found' });

  const amount = Number(req.body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ ok: false, error: 'invalid_amount' });

  agent.power = Math.min(1000, agent.power + amount);
  agent.status = 'active';
  agent.updatedAt = now();

  state.actionLogs.unshift({ id: `log_${nanoid(10)}`, agentId: agent.id, actionType: 'charge', powerCost: 0, computeCost: 0, result: { gainedPower: amount }, ts: now() });
  saveState();

  res.json({ ok: true, data: agent });
});

app.post('/agents/:id/actions', (req, res) => {
  const agent = ensureAgent(req.params.id);
  if (!agent) return res.status(404).json({ ok: false, error: 'agent_not_found' });

  const action = String(req.body?.action || '').trim();
  const powerCost = Number(req.body?.powerCost ?? 0);
  const computeCost = Number(req.body?.computeCost ?? 0);

  if (!action) return res.status(400).json({ ok: false, error: 'action_required' });
  if (powerCost < 0 || computeCost < 0) return res.status(400).json({ ok: false, error: 'invalid_cost' });

  if (agent.power < powerCost) return res.status(400).json({ ok: false, error: 'insufficient_power', data: { power: agent.power, required: powerCost } });
  if (agent.computeAvailable < computeCost) return res.status(400).json({ ok: false, error: 'insufficient_compute', data: { computeAvailable: agent.computeAvailable, required: computeCost } });

  agent.power -= powerCost;
  agent.computeAvailable -= computeCost;

  // very small action simulation
  if (action === 'scavenge') agent.inventory.scrap += 2;
  if (action === 'refine') {
    if ((agent.inventory.scrap ?? 0) >= 5) {
      agent.inventory.scrap -= 5;
      agent.inventory.alloy += 1;
    }
  }
  if (action === 'mine_meteor') {
    const activeMeteor = state.events.find((e) => e.type === 'METEOR_FALL' && e.status === 'mining');
    if (!activeMeteor) {
      return res.status(400).json({ ok: false, error: 'no_active_meteor' });
    }
    const gain = activeMeteor.level === 'M3' ? 3 : activeMeteor.level === 'M2' ? 2 : 1;
    agent.inventory.rareEarth += gain;
  }

  agent.status = agent.power <= 0 ? 'sleep' : 'active';
  agent.updatedAt = now();

  const log = {
    id: `log_${nanoid(10)}`,
    agentId: agent.id,
    actionType: action,
    powerCost,
    computeCost,
    result: { power: agent.power, computeAvailable: agent.computeAvailable, inventory: agent.inventory },
    ts: now()
  };

  state.actionLogs.unshift(log);
  if (state.actionLogs.length > 5000) state.actionLogs = state.actionLogs.slice(0, 5000);
  saveState();

  res.json({ ok: true, data: { agent, log } });
});

app.get('/events', (req, res) => {
  res.json({ ok: true, data: state.events.slice(0, 50) });
});

app.get('/logs/:agentId', (req, res) => {
  const list = state.actionLogs.filter((x) => x.agentId === req.params.agentId).slice(0, 100);
  res.json({ ok: true, data: list });
});

app.post('/admin/tick', (req, res) => {
  processTick();
  res.json({ ok: true, data: { ticks: state.worldClock.ticks, lastTickAt: state.worldClock.lastTickAt } });
});

setInterval(processTick, state.config.tickSeconds * 1000);

app.listen(PORT, () => {
  console.log(`[Claw Wasteland] server running on :${PORT}`);
  console.log(`[Claw Wasteland] next meteor at ${new Date(state.nextMeteorAt).toISOString()}`);
});
