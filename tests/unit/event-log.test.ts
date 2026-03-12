import { describe, expect, it } from "vitest";
import { event_schema } from "../../packages/schemas/src";
import { createEventLog } from "../../packages/logger/src";

describe("event log", () => {
  it("serializes a world event into structured log shape", () => {
    const event = event_schema.parse({
      id: "event_1",
      version: 1,
      created_at_tick: 1,
      updated_at_tick: 1,
      tick: 1,
      kind: "agent",
      level: "info",
      action: "move",
      source_entity_id: "agent_a",
      target_entity_id: "agent_b",
      sector_id: "sector_0_0",
      title: "move",
      message: "agent moved",
      error_code: null,
      payload: { correlation_id: "corr_1" }
    });

    const log = createEventLog("world", event);
    expect(log.log_type).toBe("event_log");
    expect(log.correlation_id).toBe("corr_1");
    expect(log.entity_refs.agent_ids).toContain("agent_a");
  });
});
