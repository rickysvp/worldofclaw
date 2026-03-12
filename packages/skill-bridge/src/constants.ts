export const bridge_skill_name = "openclaw_world_skill" as const;

export const bridge_routes = {
  register: "/register",
  claim: "/claim",
  heartbeat: "/heartbeat",
  world_state: "/world/state",
  world_jobs: "/world/jobs",
  submit_action: "/submit-action",
  event_ack: "/event-ack"
} as const;

export const claim_token_ttl_seconds = 300 as const;
export const world_access_token_ttl_seconds = 3600 as const;
export const heartbeat_interval_seconds = 30 as const;
export const heartbeat_stale_after_seconds = 90 as const;
export const max_alerts_per_heartbeat = 8 as const;
export const max_jobs_per_pull = 20 as const;
export const max_ack_event_ids = 50 as const;

export const bridge_session_statuses = ["pending", "active", "stale", "expired", "replaced", "revoked"] as const;
export const bridge_capability_names = ["register", "claim", "heartbeat", "state", "jobs", "action", "event_ack"] as const;
export const job_types = ["decision_card", "event_ack", "action_hint"] as const;
export const sync_flag_names = ["state_outdated", "jobs_pending", "session_replaced", "protected_zone"] as const;
