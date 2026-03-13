import { WorldState } from '../shared/types';

export const ReportGenerator = {
  generateDailyReport(state: WorldState): string {
    const totalCredits = state.agents.reduce((sum, a) => sum + a.credits, 0);
    const totalOre = state.agents.reduce((sum, a) => {
      const ore = a.inventory.find(i => i.type === 'ore');
      return sum + (ore?.amount || 0);
    }, 0);

    return `
# WASTELAND DAILY REPORT - CYCLE ${state.tick}

## ECONOMIC OVERVIEW
- Total Credits in Circulation: ${totalCredits}
- Total Ore Extracted: ${totalOre}

## AGENT STATUS
${state.agents.map(a => `- ${a.name} (${a.type}): ${a.status} at ${a.location}. Last: ${a.lastAction}`).join('\n')}

## WORLD EVENTS
${state.events.slice(0, 5).map(e => `[Tick ${e.tick}] ${e.message}`).join('\n')}
    `.trim();
  }
};
