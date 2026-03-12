import type { BridgeRequest, BridgeResponse } from "../../../../packages/skill-bridge/src";
import { claim_request_schema, claim_response_schema } from "../../../../packages/skill-bridge/src";
import { withIdempotency } from "../middleware/idempotency";
import { enforceRateLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";
import { claimSession } from "../services/session.service";

export const claimController = (request: BridgeRequest<unknown>): BridgeResponse<unknown> => {
  const validated = validateBody(claim_request_schema, request.body);
  if ("status" in validated) {
    return validated;
  }
  const rate = enforceRateLimit("claim", validated.data.agent_id);
  if ("status" in rate) {
    return rate;
  }

  return withIdempotency("claim", validated.data.agent_id, validated.data.idempotency_key, () => {
    const result = claimSession(validated.data);
    if ("error_code" in result) {
      const status = result.error_code === "BRIDGE_AGENT_NOT_FOUND" ? 404 : result.error_code === "BRIDGE_SKILL_NAME_MISMATCH" ? 409 : 401;
      return {
        status,
        body: {
          ok: false,
          error_code: result.error_code,
          message: "Claim could not be completed."
        }
      };
    }
    return {
      status: 200,
      body: {
        ok: true,
        data: claim_response_schema.parse(result)
      }
    };
  });
};
