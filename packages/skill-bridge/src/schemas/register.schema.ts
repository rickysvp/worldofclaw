import { z } from "zod";
import { bridge_capability_names, bridge_skill_name } from "../constants";

export const bridge_capabilities_schema = z.object({
  register: z.boolean(),
  claim: z.boolean(),
  heartbeat: z.boolean(),
  state: z.boolean(),
  jobs: z.boolean(),
  action: z.boolean(),
  event_ack: z.boolean()
}).strict();

export const register_request_schema = z.object({
  idempotency_key: z.string().min(8).max(128),
  skill_name: z.literal(bridge_skill_name),
  user_id: z.string().min(1).max(128),
  agent_id: z.string().min(1).max(128),
  skill_version: z.string().min(1).max(64),
  local_digest: z.string().min(8).max(128),
  requested_capabilities: bridge_capabilities_schema
}).strict();

export const register_response_schema = z.object({
  registration_id: z.string().min(1).max(128),
  claim_token: z.string().min(16).max(256),
  claim_expires_at_seconds: z.number().int().min(0),
  heartbeat_interval_seconds: z.number().int().min(1)
}).strict();
