import { describe, expect, it } from "vitest";
import { heartbeat_request_schema } from "../../packages/skill-bridge/src";

describe("heartbeat schema", () => {
  it("accepts a valid heartbeat payload", () => {
    const parsed = heartbeat_request_schema.parse({
      idempotency_key: "idem_heartbeat_12345",
      session_id: "session_1",
      agent_id: "agent_1",
      tick_seen: 5,
      sent_at_seconds: 100,
      liveness: { cpu_ok: true, memory_ok: true, network_ok: true },
      capabilities: {
        register: true,
        claim: true,
        heartbeat: true,
        state: true,
        jobs: true,
        action: true,
        event_ack: true
      },
      local_digest: "digest_heartbeat_1234",
      alerts: []
    });

    expect(parsed.tick_seen).toBe(5);
  });
});
