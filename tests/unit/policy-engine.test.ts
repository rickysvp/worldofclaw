import { describe, expect, it } from "vitest";
import { evaluatePolicy, type PlatformActor } from "../../packages/access-control/src";

describe("policy engine", () => {
  it("allows owner to read own usage", () => {
    const actor: PlatformActor = { actor_id: "owner_1", roles: ["owner"], owner_account_id: "acct_1", organization_id: null };
    const decision = evaluatePolicy({
      actor,
      permission: "usage:read",
      resource: { resource_type: "usage", resource_id: "acct_1", owner_account_id: "acct_1", organization_id: null, plan_id: "free" }
    });
    expect(decision.allowed).toBe(true);
  });

  it("denies viewer invoice writes", () => {
    const actor: PlatformActor = { actor_id: "viewer_1", roles: ["viewer"], owner_account_id: "acct_1", organization_id: null };
    const decision = evaluatePolicy({
      actor,
      permission: "invoices:write",
      resource: { resource_type: "invoice", resource_id: "acct_1", owner_account_id: "acct_1", organization_id: null, plan_id: "free" }
    });
    expect(decision.allowed).toBe(false);
  });
});
