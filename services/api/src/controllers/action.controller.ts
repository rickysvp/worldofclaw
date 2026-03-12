import type { BridgeRequest, BridgeResponse } from "../../../../packages/skill-bridge/src";
import { action_submit_request_schema, action_submit_response_schema } from "../../../../packages/skill-bridge/src";
import { authenticate } from "../middleware/auth";
import { withIdempotency } from "../middleware/idempotency";
import { enforceRateLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";
import { dispatchSubmittedAction } from "../services/bridge-dispatch.service";

export const actionController = (request: BridgeRequest<unknown>): BridgeResponse<unknown> => {
  const auth = authenticate(request.headers?.authorization);
  if ("status" in auth) {
    return auth;
  }
  const validated = validateBody(action_submit_request_schema, request.body);
  if ("status" in validated) {
    return validated;
  }
  const rate = enforceRateLimit("submit-action", auth.session_id);
  if ("status" in rate) {
    return rate;
  }

  return withIdempotency("submit-action", auth.session_id, validated.data.idempotency_key, () => {
    const result = dispatchSubmittedAction(auth.session_id, validated.data);
    if (!result) {
      return {
        status: 404,
        body: { ok: false, error_code: "BRIDGE_SESSION_NOT_FOUND", message: "Session not found." }
      };
    }
    if (!result.accepted) {
      return {
        status: 409,
        body: {
          ok: true,
          data: action_submit_response_schema.parse(result)
        }
      };
    }
    return {
      status: 200,
      body: {
        ok: true,
        data: action_submit_response_schema.parse(result)
      }
    };
  });
};
