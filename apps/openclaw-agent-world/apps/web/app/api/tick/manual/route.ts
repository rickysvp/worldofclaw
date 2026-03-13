import { NextResponse } from 'next/server';
import { WorldEngine } from '@world-core/engine';

export async function POST() {
  try {
    WorldEngine.tick();
    return NextResponse.json({ message: 'Manual tick processed' });
  } catch (error) {
    console.error('[Next API] Error processing tick:', error);
    return NextResponse.json({ error: 'Failed to process tick' }, { status: 500 });
  }
}
