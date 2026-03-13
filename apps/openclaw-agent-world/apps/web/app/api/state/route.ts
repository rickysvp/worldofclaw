import { NextResponse } from 'next/server';
import { StateManager } from '@world-core/state-manager';
import { WorldEngine } from '@world-core/engine';

// Ensure the tick engine runs in the background
const globalWithTick = global as typeof globalThis & {
  tickInterval?: NodeJS.Timeout;
};

if (!globalWithTick.tickInterval) {
  console.log('[Next API] Starting background tick engine...');
  globalWithTick.tickInterval = setInterval(() => {
    try {
      WorldEngine.tick();
    } catch (err) {
      console.error('[Next API] Background tick error:', err);
    }
  }, 60000);
}

export async function GET() {
  try {
    const state = StateManager.read();
    return NextResponse.json(state);
  } catch (error) {
    console.error('[Next API] Error reading state:', error);
    return NextResponse.json({ 
      error: 'Failed to read world state', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
