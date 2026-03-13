import { NextResponse } from 'next/server';
import { StateManager } from '@world-core/state-manager';

export async function POST(req: Request) {
  try {
    const { decisionId, optionId } = await req.json();
    const state = StateManager.read();
    const decision = state.decisions.find(d => d.id === decisionId);
    const agent = state.agents.find(a => a.id === decision?.agentId);

    if (decision && agent) {
      decision.status = 'resolved';
      const option = decision.options.find(o => o.id === optionId);
      
      if (optionId === 'opt-1') {
        const success = Math.random() > 0.5;
        if (success) {
          agent.credits += 100;
          agent.lastAction = `Investigated artifact and found 100 credits!`;
        } else {
          agent.credits -= 20;
          agent.lastAction = `Investigated artifact and got injured. Lost 20 credits.`;
        }
      } else {
        agent.lastAction = `Ignored the artifact and continued mission.`;
      }

      StateManager.write(state);
      return NextResponse.json({ message: 'Decision resolved' });
    } else {
      return NextResponse.json({ error: 'Decision or Agent not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('[Next API] Error resolving decision:', error);
    return NextResponse.json({ error: 'Failed to resolve decision' }, { status: 500 });
  }
}
