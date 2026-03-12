import { describe, expect, it } from "vitest";
import { createActionLifecycleRecord, completeLifecycle, startLifecycle } from "../../packages/simulation/src";
import { createRuntimeAction } from "../../packages/simulation/src";
import type { PendingAction } from "../../packages/schemas/src";

const move_action: PendingAction = {
  id: "action_lifecycle_move",
  tick_number: 1,
  agent_id: "agent_01",
  action_type: "move",
  target_sector_id: "sector_1_0",
  target_agent_id: null,
  facility_id: null,
  trade_side: null,
  trade_resource_type: null,
  trade_amount: 0,
  unit_price: 0,
  build_facility_type: null,
  claim_target_kind: null,
  claim_target_id: null,
  preferred_resource_type: null
};

describe("action lifecycle", () => {
  it("transitions queued actions into running and terminal states", () => {
    const runtime_action = createRuntimeAction(move_action);
    const initial = createActionLifecycleRecord(runtime_action);
    const started = startLifecycle(runtime_action, 1);
    const completed = completeLifecycle(started.lifecycle, {
      action_id: runtime_action.id,
      agent_id: runtime_action.agent_id,
      action_type: runtime_action.action_type,
      status: "succeeded",
      success: true,
      result_code: "action_applied",
      error_code: null,
      summary: "move applied",
      started_at_tick: 1,
      finished_at_tick: 1,
      event_ids: [],
      ledger_ids: [],
      effects: {}
    }, 1);

    expect(initial.status).toBe("queued");
    expect(started.runtime_action.status).toBe("running");
    expect(completed.status).toBe("succeeded");
  });
});
