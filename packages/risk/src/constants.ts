export const risk_actions = ["warning", "temporary_throttle", "feature_downgrade", "suspend", "ban"] as const;
export const dispute_statuses = ["open", "under_review", "resolved", "rejected"] as const;
export const rate_limit_windows = {
  heartbeat_seconds: 60,
  api_seconds: 60
} as const;
