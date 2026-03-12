import type { BridgeRequest, BridgeResponse } from "../../../../packages/skill-bridge/src";
import { event_ack_request_schema, event_ack_response_schema } from "../../../../packages/skill-bridge/src";
import { authenticate } from "../middleware/auth";
import { withIdempotency } from "../middleware/idempotency";
import { enforceRateLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";
import { dispatchEventAck } from "../services/bridge-dispatch.service";

export const eventAckController = (request: BridgeRequest<unknown>): BridgeResponse<unknown> => {
  const auth = authenticate(request.headers?.authorization);
  if ("status" in auth) {
    return auth;
  }
  const validated = validateBody(event_ack_request_schema, request.body);
  if ("status" in validated) {
    return validated;
  }
  if (validated.data.session_id !== auth.session_id) {
    return {
      status: 409,
      body: { ok: false, error_code: "BRIDGE_EVENT_ACK_INVALID", message: "Session mismatch during event acknowledgement." }
    };
  }
  const rate = enforceRateLimit("event-ack", auth.session_id);
  if ("status" in rate) {
    return rate;
  }

  return withIdempotency("event-ack", auth.session_id, validated.data.idempotency_key, () => {
    const result = dispatchEventAck(validated.data);
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
        data: event_ack_response_schema.parse(result)
      }
    };
  });
};
