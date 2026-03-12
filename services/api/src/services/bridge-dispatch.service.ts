import type { z } from "zod";
import type { action_submit_request_schema } from "../../../../packages/skill-bridge/src/schemas/action-submit.schema";
import type { event_ack_request_schema } from "../../../../packages/skill-bridge/src/schemas/event-ack.schema";
import { acknowledgeEvents, getJobsForSession, getStateView, queueSubmittedAction } from "./session.service";

export const loadWorldStateForSession = (session_id: string) => getStateView(session_id);
export const loadJobsForSession = (session_id: string) => getJobsForSession(session_id);

export const dispatchSubmittedAction = (session_id: string, body: z.infer<typeof action_submit_request_schema>) =>
  queueSubmittedAction({ session_id, body });

export const dispatchEventAck = (body: z.infer<typeof event_ack_request_schema>) =>
  acknowledgeEvents({ session_id: body.session_id, event_ids: body.event_ids });
