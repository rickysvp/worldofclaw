import { NextResponse } from 'next/server';
import { StateManager } from '@world-core/state-manager';
import { ReportGenerator } from '@world-core/report-generator';

export async function GET() {
  try {
    const state = StateManager.read();
    const report = ReportGenerator.generateDailyReport(state);
    return new Response(report, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('[Next API] Error generating report:', error);
    return new Response('Failed to generate report', { status: 500 });
  }
}
