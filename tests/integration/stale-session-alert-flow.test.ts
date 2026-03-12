import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleAlertsRoute } from "../../services/admin/src/routes/alerts";
import { handleClaimRoute } from "../../services/api/src/routes/claim";
import { handleHeartbeatRoute } from "../../services/api/src/routes/heartbeat";
import { handleRegisterRoute } from "../../services/api/src/routes/register";
import { getSessionByAccessToken, resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("stale session alert flow", () => {
  beforeEach(() => {
    resetSessionService();
    seedBridgeAgentForTests({ user_id: "user_alert", agent_id: "agent_alert" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("raises stale session alert after heartbeat ages out", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-13T00:00:00.000Z"));

    const register = handleRegisterRoute({
      body: {
        idempotency_key: "idem_register_alert",
        skill_name: "openclaw_world_skill",
        user_id: "user_alert",
        agent_id: "agent_alert",
        skill_version: "0.1.0",
        local_digest: "digest_alert",
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
        idempotency_key: "idem_claim_alert",
        claim_token: registerData.claim_token,
        skill_name: "openclaw_world_skill",
        agent_id: "agent_alert",
        local_digest: "digest_alert"
      }
    });
    if (!claim.body.ok) throw new Error("claim failed");
    const claimData = claim.body.data as { world_access_token: string; session_id: string };

    handleHeartbeatRoute({
      headers: { authorization: `Bearer ${claimData.world_access_token}` },
      body: {
        idempotency_key: "idem_heartbeat_alert",
        session_id: claimData.session_id,
        agent_id: "agent_alert",
        tick_seen: 0,
        sent_at_seconds: 10,
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
        local_digest: "digest_alert",
        alerts: []
      }
    });

    vi.setSystemTime(new Date("2026-03-13T00:02:00.000Z"));
    getSessionByAccessToken(claimData.world_access_token, Math.floor(Date.now() / 1000));

    const alerts = handleAlertsRoute({ headers: { "x-admin-token": "openclaw_admin_local_token" } });
    expect(alerts.status).toBe(200);
    expect(alerts.body.ok).toBe(true);
    if (alerts.body.ok) {
      const data = alerts.body.data;
      if (!data) throw new Error("missing alerts data");
      expect(data.some((alert) => alert.code === "STALE_SESSION")).toBe(true);
    }
  });
});
