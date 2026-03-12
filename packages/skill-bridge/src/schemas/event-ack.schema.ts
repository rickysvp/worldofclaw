import { z } from "zod";
import { max_ack_event_ids } from "../constants";

export const event_ack_request_schema = z.object({
  idempotency_key: z.string().min(8).max(128),
  session_id: z.string().min(1).max(128),
  agent_id: z.string().min(1).max(128),
  event_ids: z.array(z.string().min(1).max(128)).min(1).max(max_ack_event_ids)
}).strict();

export const event_ack_response_schema = z.object({
  acked_event_ids: z.array(z.string().min(1).max(128)),
  remaining_pending_event_ids: z.array(z.string().min(1).max(128))
}).strict();
