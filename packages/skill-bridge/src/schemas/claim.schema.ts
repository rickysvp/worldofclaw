import { z } from "zod";
import { bridge_session_statuses } from "../constants";

export const claim_request_schema = z.object({
  idempotency_key: z.string().min(8).max(128),
  claim_token: z.string().min(16).max(256),
  skill_name: z.string().min(1).max(128),
  agent_id: z.string().min(1).max(128),
  local_digest: z.string().min(8).max(128)
}).strict();

export const claim_response_schema = z.object({
  session_id: z.string().min(1).max(128),
  world_access_token: z.string().min(16).max(256),
  access_expires_at_seconds: z.number().int().min(0),
  session_status: z.enum(bridge_session_statuses)
}).strict();
