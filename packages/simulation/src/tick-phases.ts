export const tick_phase_order = [
  "environment",
  "resource_refresh",
  "agent_upkeep",
  "action_resolution",
  "relation",
  "event_emission"
] as const;

export type TickPhaseName = (typeof tick_phase_order)[number];
