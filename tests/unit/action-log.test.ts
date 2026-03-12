import { describe, expect, it } from "vitest";
import { createActionLog } from "../../packages/logger/src";
import type { ResolvedActionRecord } from "../../packages/schemas/src";

describe("action log", () => {
  it("creates structured action logs", () => {
    const action: ResolvedActionRecord = {
      action_id: "action_1",
      agent_id: "agent_1",
      action_type: "move",
      status: "succeeded",
      success: true,
      result_code: "action_applied",
      summary: "moved",
      error_code: null,
      started_at_tick: 2,
      finished_at_tick: 2,
      event_ids: [],
      ledger_ids: [],
      effects: {}
    };

    const log = createActionLog("world", action);
    expect(log.log_type).toBe("action_log");
    expect(log.payload.action_type).toBe("move");
  });
});
