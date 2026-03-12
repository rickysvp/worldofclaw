import { newbie_safe_ticks } from "../../schemas/src";

export const onboarding_statuses = [
  "uninitialized",
  "wallet_connected",
  "claw_bound",
  "skill_verified",
  "spawn_assigned",
  "starter_resources_granted",
  "starter_strategy_applied",
  "protected_boot",
  "completed",
  "failed"
] as const;

export const onboarding_steps = [
  "connect_wallet",
  "bind_claw",
  "verify_skill",
  "assign_spawn",
  "grant_starter_resources",
  "apply_starter_strategy",
  "activate_safe_window",
  "finish"
] as const;

export const onboarding_error_codes = [
  "ONBOARDING_WALLET_REQUIRED",
  "ONBOARDING_CLAW_REQUIRED",
  "ONBOARDING_AGENT_REQUIRED",
  "ONBOARDING_SKILL_REQUIRED",
  "ONBOARDING_SKILL_INVALID",
  "ONBOARDING_SPAWN_UNAVAILABLE",
  "ONBOARDING_ALREADY_COMPLETED",
  "ONBOARDING_INVALID_TRANSITION"
] as const;

export const starter_resource_defaults = {
  power: 8,
  scrap: 2,
  composite: 0,
  circuit: 0,
  flux: 0,
  xenite: 0,
  compute_core: 0,
  credits: 10
} as const;

export const starter_strategy_defaults = {
  risk_level: "low",
  automation_mode: "conservative",
  market_mode: "npc_only",
  combat_mode: "avoid"
} as const;

export const skill_verification_statuses = ["missing", "pending", "verified", "invalid"] as const;

export const onboarding_safe_window_ticks = newbie_safe_ticks;
