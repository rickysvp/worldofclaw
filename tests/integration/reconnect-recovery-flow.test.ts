import { beforeEach, describe, expect, it } from "vitest";
import { handleClaimRoute } from "../../services/api/src/routes/claim";
import { handleHeartbeatRoute } from "../../services/api/src/routes/heartbeat";
import { handleRegisterRoute } from "../../services/api/src/routes/register";
import { resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("reconnect recovery flow", () => {
  beforeEach(() => {
    resetSessionService();
    seedBridgeAgentForTests({ user_id: "user_reconnect", agent_id: "agent_reconnect" });
  });

  it("replaces the old session when a new claim is issued", () => {
    const registerOne = handleRegisterRoute({
      body: {
        idempotency_key: "idem_register_reconnect_1",
        skill_name: "openclaw_world_skill",
        user_id: "user_reconnect",
        agent_id: "agent_reconnect",
        skill_version: "0.1.0",
        local_digest: "digest_reconnect_1",
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
    if (!registerOne.body.ok) throw new Error("register failed");
    const registerOneData = registerOne.body.data as { claim_token: string };

    const claimOne = handleClaimRoute({
      body: {
        idempotency_key: "idem_claim_reconnect_1",
        claim_token: registerOneData.claim_token,
        skill_name: "openclaw_world_skill",
        agent_id: "agent_reconnect",
        local_digest: "digest_reconnect_1"
      }
    });
    if (!claimOne.body.ok) throw new Error("claim one failed");
    const claimOneData = claimOne.body.data as { world_access_token: string; session_id: string };

    const registerTwo = handleRegisterRoute({
      body: {
        idempotency_key: "idem_register_reconnect_2",
        skill_name: "openclaw_world_skill",
        user_id: "user_reconnect",
        agent_id: "agent_reconnect",
        skill_version: "0.1.1",
        local_digest: "digest_reconnect_2",
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
    if (!registerTwo.body.ok) throw new Error("register two failed");
    const registerTwoData = registerTwo.body.data as { claim_token: string };

    const claimTwo = handleClaimRoute({
      body: {
        idempotency_key: "idem_claim_reconnect_2",
        claim_token: registerTwoData.claim_token,
        skill_name: "openclaw_world_skill",
        agent_id: "agent_reconnect",
        local_digest: "digest_reconnect_2"
      }
    });
    if (!claimTwo.body.ok) throw new Error("claim two failed");
    const claimTwoData = claimTwo.body.data as { world_access_token: string; session_id: string };

    const oldHeartbeat = handleHeartbeatRoute({
      headers: { authorization: `Bearer ${claimOneData.world_access_token}` },
      body: {
        idempotency_key: "idem_old_heartbeat",
        session_id: claimOneData.session_id,
        agent_id: "agent_reconnect",
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
        local_digest: "digest_reconnect_1",
        alerts: []
      }
    });

    expect(oldHeartbeat.status).toBe(409);

    const newHeartbeat = handleHeartbeatRoute({
      headers: { authorization: `Bearer ${claimTwoData.world_access_token}` },
      body: {
        idempotency_key: "idem_new_heartbeat",
        session_id: claimTwoData.session_id,
        agent_id: "agent_reconnect",
        tick_seen: 0,
        sent_at_seconds: 101,
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
        local_digest: "digest_reconnect_2",
        alerts: []
      }
    });

    expect(newHeartbeat.status).toBe(200);
  });
});
