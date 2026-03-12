import { z } from "zod";
import { action_enum } from "../../../schemas/src";

export const action_submit_request_schema = z.object({
  idempotency_key: z.string().min(8).max(128),
  agent_id: z.string().min(1).max(128),
  action_type: action_enum,
  tick_seen: z.number().int().min(0),
  payload: z.record(z.string(), z.union([z.string(), z.number().int(), z.boolean(), z.null()]))
}).strict();

export const action_submit_response_schema = z.object({
  action_id: z.string().min(1).max(128),
  accepted: z.boolean(),
  expected_end_tick: z.number().int().min(0),
  error_code: z.string().min(1).max(128).nullable()
}).strict();
