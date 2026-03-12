import { describe, expect, it } from "vitest";
import { register_request_schema } from "../../packages/skill-bridge/src";

describe("register schema", () => {
  it("accepts a valid register payload", () => {
    const parsed = register_request_schema.parse({
      idempotency_key: "idem_register_12345",
      skill_name: "openclaw_world_skill",
      user_id: "user_1",
      agent_id: "agent_1",
      skill_version: "0.1.0",
      local_digest: "digest_12345678",
      requested_capabilities: {
        register: true,
        claim: true,
        heartbeat: true,
        state: true,
        jobs: true,
        action: true,
        event_ack: true
      }
    });

    expect(parsed.skill_name).toBe("openclaw_world_skill");
  });
});
