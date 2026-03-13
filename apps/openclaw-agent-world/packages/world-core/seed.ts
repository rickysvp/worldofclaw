import * as fs from 'fs';
import * as path from 'path';
import { WorldState } from '../shared/types';

const initialState: WorldState = {
  tick: 0,
  agents: [
    {
      id: 'agent-1',
      name: 'Dusty',
      type: 'miner',
      location: 'mine',
      inventory: [{ type: 'ore', amount: 0 }],
      credits: 50,
      status: 'idle'
    },
    {
      id: 'agent-2',
      name: 'Sparky',
      type: 'maker',
      location: 'ruins_camp',
      inventory: [{ type: 'scrap', amount: 5 }],
      credits: 30,
      status: 'idle'
    },
    {
      id: 'agent-3',
      name: 'Slick',
      type: 'trader',
      location: 'trading_post',
      inventory: [{ type: 'crystal', amount: 2 }],
      credits: 200,
      status: 'idle'
    }
  ],
  locations: [
    {
      id: 'mine',
      name: 'The Iron Vein',
      description: 'A deep excavation site rich in raw ore.',
      resources: [{ type: 'ore', amount: 1000 }]
    },
    {
      id: 'trading_post',
      name: 'Neon Junction',
      description: 'The central hub for wasteland commerce.',
      resources: [
        { type: 'ore', amount: 10 },
        { type: 'scrap', amount: 10 },
        { type: 'crystal', amount: 5 }
      ]
    },
    {
      id: 'ruins_camp',
      name: 'Shadow Outpost',
      description: 'A makeshift camp built amidst the ruins of the old world.',
      resources: [{ type: 'scrap', amount: 500 }]
    }
  ],
  events: [
    {
      id: 'event-0',
      tick: 0,
      message: 'World initialized. The wasteland awaits.',
      type: 'info'
    }
  ],
  decisions: [],
  config: {
    tickIntervalMs: 60000, // 1 minute
    resourcePrices: {
      ore: 5,
      scrap: 8,
      crystal: 25
    }
  }
};

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

fs.writeFileSync(
  path.join(dataDir, 'world-state.json'),
  JSON.stringify(initialState, null, 2)
);

console.log('Seed data generated successfully in data/world-state.json');
