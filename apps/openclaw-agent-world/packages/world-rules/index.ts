import { WorldState, Agent, Location } from '../shared/types';

export const RuleExecutor = {
  resolveAgents(state: WorldState): void {
    state.agents.forEach(agent => {
      this.resolveAgentAction(agent, state);
    });
  },

  resolveAgentAction(agent: Agent, state: WorldState): void {
    const location = state.locations.find(l => l.id === agent.location);
    if (!location) return;

    // Random Decision Generation (5% chance)
    if (Math.random() < 0.05 && !state.decisions.find(d => d.agentId === agent.id && d.status === 'pending')) {
      const decisionId = `dec-${Date.now()}-${agent.id}`;
      state.decisions.push({
        id: decisionId,
        agentId: agent.id,
        description: `${agent.name} encountered a mysterious glowing artifact in the ${location.name}. What should they do?`,
        options: [
          { id: 'opt-1', label: 'Investigate', effectDesc: 'High risk, high reward.' },
          { id: 'opt-2', label: 'Ignore', effectDesc: 'Stay safe and continue mission.' }
        ],
        status: 'pending'
      });
      agent.status = 'idle';
      agent.lastAction = `Waiting for command regarding artifact.`;
      return;
    }

    // Skip if agent has pending decision
    if (state.decisions.find(d => d.agentId === agent.id && d.status === 'pending')) {
      return;
    }

    switch (agent.type) {
      case 'miner':
        this.handleMiner(agent, location, state);
        break;
      case 'maker':
        this.handleMaker(agent, location, state);
        break;
      case 'trader':
        this.handleTrader(agent, location, state);
        break;
    }
  },

  handleMiner(agent: Agent, location: Location, state: WorldState): void {
    if (agent.location === 'mine') {
      const oreInLoc = location.resources.find(r => r.type === 'ore');
      if (oreInLoc && oreInLoc.amount > 0) {
        const amount = Math.min(5, oreInLoc.amount);
        oreInLoc.amount -= amount;
        
        const oreInInv = agent.inventory.find(r => r.type === 'ore');
        if (oreInInv) oreInInv.amount += amount;
        else agent.inventory.push({ type: 'ore', amount });

        agent.status = 'working';
        agent.lastAction = `Mined ${amount} ore from ${location.name}.`;
      }
    } else {
      agent.status = 'traveling';
      agent.location = 'mine';
      agent.lastAction = `Traveling to the mine.`;
    }
  },

  handleMaker(agent: Agent, location: Location, state: WorldState): void {
    if (agent.location === 'ruins_camp') {
      const scrapInLoc = location.resources.find(r => r.type === 'scrap');
      if (scrapInLoc && scrapInLoc.amount > 0) {
        const amount = Math.min(3, scrapInLoc.amount);
        scrapInLoc.amount -= amount;

        const scrapInInv = agent.inventory.find(r => r.type === 'scrap');
        if (scrapInInv) scrapInInv.amount += amount;
        else agent.inventory.push({ type: 'scrap', amount });

        agent.status = 'working';
        agent.lastAction = `Scavenged ${amount} scrap from ${location.name}.`;
      }
    } else {
      agent.status = 'traveling';
      agent.location = 'ruins_camp';
      agent.lastAction = `Traveling to ruins camp.`;
    }
  },

  handleTrader(agent: Agent, location: Location, state: WorldState): void {
    // Trader logic: Buy low, sell high (simplified for demo)
    if (agent.location === 'trading_post') {
      agent.status = 'working';
      agent.credits += 10; // Passive income for demo
      agent.lastAction = `Managing trades at ${location.name}. Collected 10 credits.`;
    } else {
      agent.status = 'traveling';
      agent.location = 'trading_post';
      agent.lastAction = `Heading to the trading post.`;
    }
  }
};
