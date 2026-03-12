import type { BridgeRequest, BridgeResponse } from "../../../../packages/skill-bridge/src";
import { heartbeat_request_schema, heartbeat_response_schema } from "../../../../packages/skill-bridge/src";
import { authenticate } from "../middleware/auth";
import { withIdempotency } from "../middleware/idempotency";
import { enforceRateLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";
import { processHeartbeat } from "../services/liveness.service";

export const heartbeatController = (request: BridgeRequest<unknown>): BridgeResponse<unknown> => {
  const auth = authenticate(request.headers?.authorization);
  if ("status" in auth) {
    return auth;
  }
  const validated = validateBody(heartbeat_request_schema, request.body);
  if ("status" in validated) {
    return validated;
  }
  if (validated.data.session_id !== auth.session_id) {
    return {
      status: 409,
      body: { ok: false, error_code: "BRIDGE_SESSION_NOT_FOUND", message: "Session mismatch." }
    };
  }
  const rate = enforceRateLimit("heartbeat", validated.data.agent_id);
  if ("status" in rate) {
    return rate;
  }

  return withIdempotency("heartbeat", auth.session_id, validated.data.idempotency_key, () => {
    const result = processHeartbeat(validated.data);
    if (!result) {
      return {
        status: 404,
        body: { ok: false, error_code: "BRIDGE_SESSION_NOT_FOUND", message: "Session not found." }
      };
    }
    return {
      status: 200,
      body: {
        ok: true,
        data: heartbeat_response_schema.parse(result)
      }
    };
  });
};
