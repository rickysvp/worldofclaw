import { z } from "zod";

export const state_request_schema = z.object({}).strict();

export const state_response_schema = z.object({
  server_tick: z.number().int().min(0),
  agent: z.object({
    id: z.string().min(1).max(128),
    location: z.string().min(1).max(128),
    power: z.number().int().min(0),
    durability: z.number().int().min(0),
    compute: z.number().int().min(0),
    credits: z.number().int().min(0),
    inventory: z.record(z.string(), z.number().int())
  }).strict(),
  visible_sector_ids: z.array(z.string().min(1).max(128)),
  visible_facility_ids: z.array(z.string().min(1).max(128)),
  pending_event_ids: z.array(z.string().min(1).max(128)),
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
