import { StateManager } from './state-manager';
import { WorldEvent } from '../shared/types';
import { RuleExecutor } from '../world-rules';

export const WorldEngine = {
  tick(): void {
    const state = StateManager.read();
    state.tick += 1;

    // Resolve Agent Actions
    RuleExecutor.resolveAgents(state);

    const newEvent: WorldEvent = {
      id: `event-${Date.now()}`,
      tick: state.tick,
      message: `Cycle ${state.tick} processed. Agents have completed their tasks.`,
      type: 'info'
    };

    state.events.unshift(newEvent);
    // Keep only last 50 events
    if (state.events.length > 50) {
      state.events = state.events.slice(0, 50);
    }

    StateManager.write(state);
    console.log(`[Tick Engine] Cycle ${state.tick} processed.`);
  }
};
