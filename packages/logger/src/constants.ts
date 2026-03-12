export const log_types = [
  "tick_log",
  "action_log",
  "event_log",
  "economy_log",
  "relation_log",
  "org_log",
  "heartbeat_log"
] as const;

export const log_severities = ["debug", "info", "warn", "error", "critical"] as const;

export const default_retention_by_type = {
  tick_log: 1440,
  action_log: 2880,
  event_log: 2880,
  economy_log: 4320,
  relation_log: 4320,
  org_log: 4320,
  heartbeat_log: 720
} as const;

export const archive_after_ticks = 4320 as const;
