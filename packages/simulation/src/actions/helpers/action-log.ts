import type { TickAccumulator } from "../../tick-context";

export const collectNewEventIds = (before: TickAccumulator, after: TickAccumulator): string[] =>
  after.emitted_events.slice(before.emitted_events.length).map((event) => event.id);

export const collectNewLedgerIds = (before: TickAccumulator, after: TickAccumulator): string[] =>
  after.created_ledger_entries.slice(before.created_ledger_entries.length).map((entry) => entry.id);
