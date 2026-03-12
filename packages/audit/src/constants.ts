export const alert_codes = [
  "NEGATIVE_RESOURCE",
  "DOUBLE_SETTLEMENT",
  "STALE_SESSION",
  "PRICE_SHOCK",
  "CONTROL_DRIFT",
  "TICK_STALL",
  "QUEUE_BACKLOG",
  "NEWBIE_FAILURE_SPIKE"
] as const;

export const alert_severities = ["info", "warn", "error", "critical"] as const;

export const queue_backlog_warn_threshold = 10 as const;
export const newbie_failure_ratio_threshold = 0.5 as const;
export const price_shock_threshold_bps = 1500 as const;
