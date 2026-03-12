import { createHash, randomUUID } from "node:crypto";

export const createIdempotencyKey = (input: { route: string; agent_id?: string; session_id?: string; local_digest?: string }): string => {
  const basis = JSON.stringify({
    route: input.route,
    agent_id: input.agent_id ?? null,
    session_id: input.session_id ?? null,
    local_digest: input.local_digest ?? null,
    nonce: randomUUID()
  });

  return createHash("sha256").update(basis).digest("hex");
};
