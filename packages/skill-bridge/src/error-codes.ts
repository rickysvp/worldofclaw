import { z } from "zod";

export const bridge_error_codes = [
  "BRIDGE_INVALID_REQUEST",
  "BRIDGE_INVALID_TOKEN",
  "BRIDGE_TOKEN_EXPIRED",
  "BRIDGE_SESSION_NOT_FOUND",
  "BRIDGE_SESSION_REPLACED",
  "BRIDGE_RATE_LIMITED",
  "BRIDGE_IDEMPOTENCY_CONFLICT",
  "BRIDGE_CLAIM_TOKEN_INVALID",
  "BRIDGE_CLAIM_TOKEN_USED",
  "BRIDGE_SKILL_NAME_MISMATCH",
  "BRIDGE_AGENT_NOT_FOUND",
  "BRIDGE_AGENT_MISMATCH",
  "BRIDGE_ACTION_REJECTED",
  "BRIDGE_EVENT_ACK_INVALID",
  "BRIDGE_WORLD_STATE_UNAVAILABLE"
] as const;

export const bridge_error_code_schema = z.enum(bridge_error_codes);
export type BridgeErrorCode = z.infer<typeof bridge_error_code_schema>;
