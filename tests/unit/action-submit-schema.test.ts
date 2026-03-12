import { describe, expect, it } from "vitest";
import { action_submit_request_schema } from "../../packages/skill-bridge/src";

describe("action submit schema", () => {
  it("accepts a structured action submit payload", () => {
    const parsed = action_submit_request_schema.parse({
      idempotency_key: "idem_action_12345",
      agent_id: "agent_1",
      action_type: "move",
      tick_seen: 3,
      payload: {
        target_sector_id: "sector_0_1"
      }
    });

    expect(parsed.action_type).toBe("move");
  });
});
