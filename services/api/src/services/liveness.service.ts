import type { z } from "zod";
import type { heartbeat_request_schema } from "../../../../packages/skill-bridge/src/schemas/heartbeat.schema";
import { updateHeartbeat } from "./session.service";

export const processHeartbeat = (body: z.infer<typeof heartbeat_request_schema>) =>
  updateHeartbeat({
    session_id: body.session_id,
    tick_seen: body.tick_seen,
    local_digest: body.local_digest,
    alerts: body.alerts
  });
