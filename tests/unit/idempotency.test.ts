import { beforeEach, describe, expect, it } from "vitest";
import { handleRegisterRoute } from "../../services/api/src/routes/register";
import { resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("idempotency", () => {
  beforeEach(() => {
    resetSessionService();
    seedBridgeAgentForTests({ user_id: "user_1", agent_id: "agent_1" });
    seedBridgeAgentForTests({ user_id: "user_2", agent_id: "agent_2" });
  });

  it("returns the same response for the same register idempotency key", () => {
    const request = {
      body: {
        idempotency_key: "idem_same_register",
        skill_name: "openclaw_world_skill",
        user_id: "user_1",
        agent_id: "agent_1",
        skill_version: "0.1.0",
        local_digest: "digest_same",
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
    };

    const first = handleRegisterRoute(request);
    const second = handleRegisterRoute(request);

    expect(second).toEqual(first);
  });

  it("scopes idempotency by caller identity instead of globally per route", () => {
    const first = handleRegisterRoute({
      body: {
        idempotency_key: "idem_shared_register",
        skill_name: "openclaw_world_skill",
        user_id: "user_1",
        agent_id: "agent_1",
        skill_version: "0.1.0",
        local_digest: "digest_user_1",
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

    const second = handleRegisterRoute({
      body: {
        idempotency_key: "idem_shared_register",
        skill_name: "openclaw_world_skill",
        user_id: "user_2",
        agent_id: "agent_2",
        skill_version: "0.1.0",
        local_digest: "digest_user_2",
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

    expect(first.body.ok).toBe(true);
    expect(second.body.ok).toBe(true);
    if (first.body.ok && second.body.ok) {
      const firstData = first.body.data as { registration_id: string; claim_token: string };
      const secondData = second.body.data as { registration_id: string; claim_token: string };
      expect(firstData.registration_id).not.toBe(secondData.registration_id);
      expect(firstData.claim_token).not.toBe(secondData.claim_token);
    }
  });
});
