import type { BridgeResponse } from "../../../../packages/skill-bridge/src";
import { consumeRateLimit } from "../services/session.service";

export const enforceRateLimit = (scope: string, identity: string): BridgeResponse<{ allowed: true }> | { success: true } => {
  if (!consumeRateLimit(scope, identity)) {
    return {
      status: 429,
      body: {
        ok: false,
        error_code: "BRIDGE_RATE_LIMITED",
        message: `Rate limit exceeded for ${scope}.`
      }
    };
  }
  return { success: true };
};
