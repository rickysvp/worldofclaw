import { describe, expect, it } from "vitest";
import { pending_action_schema, to_world_action } from "../../packages/schemas/src";
import { validateWorldAction } from "../../packages/simulation/src";

describe("action validator", () => {
  it("normalizes a valid move action into the canonical world action shape", () => {
    const parsed = pending_action_schema.parse({
      id: "action_move_valid",
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
    });

    const normalized = validateWorldAction(to_world_action(parsed));
    expect(normalized.success).toBe(true);
  });

  it("rejects invalid structured payloads", () => {
    const invalid = validateWorldAction({
      id: "action_trade_invalid",
      agent_id: "agent_01",
      action_type: "trade",
      status: "queued",
      created_at_tick: 1,
      scheduled_start_tick: 1,
      expected_end_tick: 1,
      payload: {
        trade_side: "buy",
        trade_amount: 2,
        unit_price: 4
      },
      error_code: null
    });

    expect(invalid.success).toBe(false);
  });
});
