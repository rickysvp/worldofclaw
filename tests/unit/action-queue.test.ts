import { describe, expect, it } from "vitest";
import type { PendingAction } from "../../packages/schemas/src";
import { createActionQueue, groupQueuedActionsByAgent, normalizeQueuedAction } from "../../packages/simulation/src";

const buildAction = (id: string, agent_id: string, action_type: PendingAction["action_type"]): PendingAction => ({
  id,
  tick_number: 1,
  agent_id,
  action_type,
  target_sector_id: action_type === "move" ? "sector_1_0" : null,
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
});

describe("action queue", () => {
  it("groups queued actions by agent while preserving order", () => {
    const queue = createActionQueue([
      buildAction("action_1", "agent_alpha", "move"),
      buildAction("action_2", "agent_alpha", "scan"),
      buildAction("action_3", "agent_beta", "scan")
    ]);

    const grouped = groupQueuedActionsByAgent(queue);
    expect(grouped.agent_alpha?.map((action) => action.id)).toEqual(["action_1", "action_2"]);
    expect(grouped.agent_beta?.map((action) => action.id)).toEqual(["action_3"]);
    expect(queue.every((action) => action.status === "queued")).toBe(true);
  });

  it("normalizes queued actions before execution", () => {
    const normalized = normalizeQueuedAction({
      id: "action_trade_normalized",
      tick_number: 1,
      agent_id: "agent_alpha",
      action_type: "trade",
      trade_side: "buy",
      trade_resource_type: "scrap",
      trade_amount: 2,
      unit_price: 4
    });

    const queue = createActionQueue([normalized]);
    expect(queue[0]?.queued_action.facility_id).toBeNull();
    expect(queue[0]?.queued_action.target_agent_id).toBeNull();
    expect(queue[0]?.queued_action.trade_amount).toBe(2);
  });
});
