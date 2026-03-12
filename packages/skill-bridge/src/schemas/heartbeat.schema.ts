import { z } from "zod";
import { bridge_session_statuses, max_alerts_per_heartbeat } from "../constants";
import { bridge_capabilities_schema } from "./register.schema";

export const heartbeat_request_schema = z.object({
  idempotency_key: z.string().min(8).max(128),
  session_id: z.string().min(1).max(128),
  agent_id: z.string().min(1).max(128),
  tick_seen: z.number().int().min(0),
  sent_at_seconds: z.number().int().min(0),
  liveness: z.object({
    cpu_ok: z.boolean(),
    memory_ok: z.boolean(),
    network_ok: z.boolean()
  }).strict(),
  capabilities: bridge_capabilities_schema,
  local_digest: z.string().min(8).max(128),
  alerts: z.array(z.object({
    code: z.string().min(1).max(64),
    level: z.enum(["info", "warn", "error"]),
    message: z.string().min(1).max(256)
  }).strict()).max(max_alerts_per_heartbeat)
}).strict();

export const heartbeat_response_schema = z.object({
  server_tick: z.number().int().min(0),
  session_status: z.enum(bridge_session_statuses),
  next_heartbeat_after_seconds: z.number().int().min(1),
  sync_flags: z.object({
    state_outdated: z.boolean(),
    jobs_pending: z.boolean(),
    session_replaced: z.boolean(),
    protected_zone: z.boolean()
  }).strict(),
  world_hints: z.object({
    protected_zone: z.boolean(),
    current_sector_id: z.string().min(1).max(128).nullable(),
    visible_sector_count: z.number().int().min(0),
    pending_event_count: z.number().int().min(0)
  }).strict()
}).strict();
