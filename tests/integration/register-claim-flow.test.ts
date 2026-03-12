import { beforeEach, describe, expect, it } from "vitest";
import { handleClaimRoute } from "../../services/api/src/routes/claim";
import { handleRegisterRoute } from "../../services/api/src/routes/register";
import { resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("register claim flow", () => {
  beforeEach(() => {
    resetSessionService();
    seedBridgeAgentForTests({ user_id: "user_register", agent_id: "agent_register" });
  });

  it("registers a skill and claims a session", () => {
    const register = handleRegisterRoute({
      body: {
        idempotency_key: "idem_register_claim_flow",
        skill_name: "openclaw_world_skill",
        user_id: "user_register",
        agent_id: "agent_register",
        skill_version: "0.1.0",
        local_digest: "digest_register_claim",
        requested_capabilities: {
          register: true,
          claim: true,
          heartbeat: true,
          state: true,
          jobs: true,
          action: true,
          event_ack: true
        }
      }
    });

    expect(register.status).toBe(200);
    if (!register.body.ok) {
      throw new Error("register failed");
    }
    const registerData = register.body.data as { claim_token: string };

    const claim = handleClaimRoute({
      body: {
        idempotency_key: "idem_claim_flow",
        claim_token: registerData.claim_token,
        skill_name: "openclaw_world_skill",
        agent_id: "agent_register",
        local_digest: "digest_register_claim"
      }
    });

    expect(claim.status).toBe(200);
    expect(claim.body.ok).toBe(true);
  });
});
