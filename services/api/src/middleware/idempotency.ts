import type { BridgeResponse } from "../../../../packages/skill-bridge/src";
import { getIdempotentResponse, recordIdempotentResponse } from "../services/session.service";

export const withIdempotency = <T>(
  scope: string,
  scope_identity: string,
  idempotency_key: string,
  producer: () => BridgeResponse<T>
): BridgeResponse<T> => {
  const existing = getIdempotentResponse<BridgeResponse<T>>(scope, scope_identity, idempotency_key);
  if (existing) {
    return existing;
  }
  const response = producer();
  recordIdempotentResponse(scope, scope_identity, idempotency_key, response);
  return response;
};
