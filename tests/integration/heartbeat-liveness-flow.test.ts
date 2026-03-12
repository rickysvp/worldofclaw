import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleClaimRoute } from "../../services/api/src/routes/claim";
import { handleHeartbeatRoute } from "../../services/api/src/routes/heartbeat";
import { handleRegisterRoute } from "../../services/api/src/routes/register";
import { getSessionByAccessToken, resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("heartbeat liveness flow", () => {
  beforeEach(() => {
    resetSessionService();
    seedBridgeAgentForTests({ user_id: "user_heartbeat", agent_id: "agent_heartbeat" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates liveness and returns sync metadata", () => {
    const register = handleRegisterRoute({
      body: {
        idempotency_key: "idem_register_heartbeat",
        skill_name: "openclaw_world_skill",
        user_id: "user_heartbeat",
        agent_id: "agent_heartbeat",
        skill_version: "0.1.0",
        local_digest: "digest_heartbeat",
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
    if (!register.body.ok) throw new Error("register failed");
    const registerData = register.body.data as { claim_token: string };

    const claim = handleClaimRoute({
      body: {
        idempotency_key: "idem_claim_heartbeat",
        claim_token: registerData.claim_token,
        skill_name: "openclaw_world_skill",
        agent_id: "agent_heartbeat",
        local_digest: "digest_heartbeat"
      }
    });
    if (!claim.body.ok) throw new Error("claim failed");
    const claimData = claim.body.data as { world_access_token: string; session_id: string };

    const heartbeat = handleHeartbeatRoute({
      headers: { authorization: `Bearer ${claimData.world_access_token}` },
      body: {
        idempotency_key: "idem_heartbeat_flow",
        session_id: claimData.session_id,
        agent_id: "agent_heartbeat",
        tick_seen: 0,
        sent_at_seconds: 100,
        liveness: { cpu_ok: true, memory_ok: true, network_ok: true },
        capabilities: {
          register: true,
          claim: true,
          heartbeat: true,
          state: true,
          jobs: true,
          action: true,
          event_ack: true
        },
        local_digest: "digest_heartbeat",
        alerts: []
      }
    });

    expect(heartbeat.status).toBe(200);
    expect(heartbeat.body.ok).toBe(true);
    if (heartbeat.body.ok) {
      const heartbeatData = heartbeat.body.data as { session_status: string; next_heartbeat_after_seconds: number };
      expect(heartbeatData.session_status).toBe("active");
      expect(heartbeatData.next_heartbeat_after_seconds).toBeGreaterThan(0);
    }
  });

  it("uses server receive time instead of trusting client sent_at_seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-13T00:00:00.000Z"));

    const register = handleRegisterRoute({
      body: {
        idempotency_key: "idem_register_heartbeat_future",
        skill_name: "openclaw_world_skill",
        user_id: "user_heartbeat",
        agent_id: "agent_heartbeat",
        skill_version: "0.1.0",
        local_digest: "digest_heartbeat_future",
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
    if (!register.body.ok) throw new Error("register failed");
    const registerData = register.body.data as { claim_token: string };

    const claim = handleClaimRoute({
      body: {
        idempotency_key: "idem_claim_heartbeat_future",
        claim_token: registerData.claim_token,
        skill_name: "openclaw_world_skill",
        agent_id: "agent_heartbeat",
        local_digest: "digest_heartbeat_future"
      }
    });
    if (!claim.body.ok) throw new Error("claim failed");
    const claimData = claim.body.data as { world_access_token: string; session_id: string };

    handleHeartbeatRoute({
      headers: { authorization: `Bearer ${claimData.world_access_token}` },
      body: {
        idempotency_key: "idem_heartbeat_future",
        session_id: claimData.session_id,
        agent_id: "agent_heartbeat",
        tick_seen: 0,
        sent_at_seconds: 9_999_999_999,
        liveness: { cpu_ok: true, memory_ok: true, network_ok: true },
        capabilities: {
          register: true,
          claim: true,
          heartbeat: true,
          state: true,
          jobs: true,
          action: true,
          event_ack: true
        },
        local_digest: "digest_heartbeat_future",
        alerts: []
      }
    });

    vi.setSystemTime(new Date("2026-03-13T00:02:00.000Z"));
    const sessionView = getSessionByAccessToken(claimData.world_access_token, Math.floor(Date.now() / 1000));

    expect(sessionView?.session.status).toBe("stale");
  });
});
