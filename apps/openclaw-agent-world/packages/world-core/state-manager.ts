import * as fs from 'fs';
import * as path from 'path';
import { WorldState } from '../shared/types';

const getSafePath = () => {
  const rootPath = process.cwd();
  // Try root/data
  const p1 = path.join(rootPath, 'data/world-state.json');
  if (fs.existsSync(p1)) return p1;
  // Try apps/web/../../data (if running from apps/web)
  const p2 = path.join(rootPath, '../../data/world-state.json');
  if (fs.existsSync(p2)) return p2;
  // Fallback to original logic but with absolute path if possible
  return path.resolve(__dirname, '../../data/world-state.json');
};

const STATE_FILE = getSafePath();

export const StateManager = {
  read(): WorldState {
    if (!fs.existsSync(STATE_FILE)) {
      throw new Error(`State file not found at ${STATE_FILE}. Please run seed script.`);
    }
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  },

  write(state: WorldState): void {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  }
};
