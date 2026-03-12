import { beforeEach, describe, expect, it } from "vitest";
import { claimSession, registerSkill, resetSessionService, seedBridgeAgentForTests, getSessionByAccessToken } from "../../services/api/src/services/session.service";

describe("token lifecycle", () => {
  beforeEach(() => {
    resetSessionService();
    seedBridgeAgentForTests({ user_id: "user_1", agent_id: "agent_1" });
  });

  it("issues a claim token once and creates an access token", () => {
    const registered = registerSkill({
      user_id: "user_1",
      agent_id: "agent_1",
      skill_name: "openclaw_world_skill",
      skill_version: "0.1.0",
      local_digest: "digest_1",
      requested_capabilities: {
        register: true,
        claim: true,
        heartbeat: true,
        state: true,
        jobs: true,
        action: true,
        event_ack: true
      },
      idempotency_key: "idem_register"
    });

    const claimed = claimSession({
      claim_token: registered.claim_token,
      agent_id: "agent_1",
      skill_name: "openclaw_world_skill",
      local_digest: "digest_1"
    });

    expect("session_id" in claimed && claimed.session_id).toBeTruthy();
    if ("world_access_token" in claimed) {
      expect(getSessionByAccessToken(claimed.world_access_token)?.session.session_id).toBe(claimed.session_id);
    }
  });
});
