import { describe, expect, it } from "vitest";
import { pending_action_schema } from "../../packages/schemas/src";

describe("action schema", () => {
  it("rejects invalid attack payloads without a target agent", () => {
    const parsed = pending_action_schema.safeParse({
      id: "action_attack_invalid",
      tick_number: 1,
      agent_id: "agent_01",
      action_type: "attack",
      target_sector_id: null,
      facility_id: null,
      trade_side: null,
      trade_resource_type: null,
      trade_amount: 0,
      unit_price: 0
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts build payloads with facility type", () => {
    const parsed = pending_action_schema.safeParse({
      id: "action_build_valid",
      tick_number: 1,
      agent_id: "agent_01",
      action_type: "build",
      target_sector_id: null,
      target_agent_id: null,
      facility_id: null,
      trade_side: null,
      trade_resource_type: null,
      trade_amount: 0,
      unit_price: 0,
      build_facility_type: "workshop",
      claim_target_kind: null,
      claim_target_id: null,
      preferred_resource_type: null
    });

    expect(parsed.success).toBe(true);
  });
});
