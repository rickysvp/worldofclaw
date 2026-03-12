import type { BridgeRequest, BridgeResponse } from "../../../../packages/skill-bridge/src";
import { jobs_response_schema } from "../../../../packages/skill-bridge/src";
import { authenticate } from "../middleware/auth";
import { enforceRateLimit } from "../middleware/rate-limit";
import { loadJobsForSession } from "../services/bridge-dispatch.service";

export const jobsController = (_request: BridgeRequest<undefined>, authorization?: string): BridgeResponse<unknown> => {
  const auth = authenticate(authorization);
  if ("status" in auth) {
    return auth;
  }
  const rate = enforceRateLimit("world-jobs", auth.session_id);
  if ("status" in rate) {
    return rate;
  }
  const result = loadJobsForSession(auth.session_id);
  if (!result) {
    return {
      status: 404,
      body: { ok: false, error_code: "BRIDGE_WORLD_STATE_UNAVAILABLE", message: "Jobs unavailable." }
    };
  }
  return {
    status: 200,
    body: {
      ok: true,
      data: jobs_response_schema.parse(result)
    }
  };
};
