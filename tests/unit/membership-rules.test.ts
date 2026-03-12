import { describe, expect, it } from "vitest";
import { buildOrganizationMembers, hasMemberRole } from "../../packages/social/src";

describe("membership rules", () => {
  it("assigns founder and trader roles", () => {
    const members = buildOrganizationMembers({
      member_agent_ids: ["a", "b"],
      founder_agent_id: "a",
      joined_at_tick: 1,
      trade_counts: { b: 3 }
    });
    expect(members[0]?.role).toBe("founder");
    expect(hasMemberRole(members, "trader")).toBe(true);
  });
});
