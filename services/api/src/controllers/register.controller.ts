import type { BridgeRequest, BridgeResponse } from "../../../../packages/skill-bridge/src";
import { register_request_schema, register_response_schema } from "../../../../packages/skill-bridge/src";
import { withIdempotency } from "../middleware/idempotency";
import { enforceRateLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";
import { getAgent, registerSkill } from "../services/session.service";

export const registerController = (request: BridgeRequest<unknown>): BridgeResponse<unknown> => {
  const validated = validateBody(register_request_schema, request.body);
  if ("status" in validated) {
    return validated;
  }
  const rate = enforceRateLimit("register", validated.data.user_id);
  if ("status" in rate) {
    return rate;
  }

  return withIdempotency("register", `${validated.data.user_id}:${validated.data.agent_id}`, validated.data.idempotency_key, () => {
    if (!getAgent(validated.data.agent_id)) {
      return {
        status: 404,
        body: {
          ok: false,
          error_code: "BRIDGE_AGENT_NOT_FOUND",
          message: "Agent not found."
        }
      };
    }
    const result = registerSkill(validated.data);
    return {
      status: 200,
      body: {
        ok: true,
        data: register_response_schema.parse(result)
      }
    };
  });
};
