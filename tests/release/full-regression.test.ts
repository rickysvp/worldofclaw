import { beforeEach, describe, expect, it } from "vitest";
import { handleRegisterRoute } from "../../services/api/src/routes/register";
import { handleClaimRoute } from "../../services/api/src/routes/claim";
import { handleHeartbeatRoute } from "../../services/api/src/routes/heartbeat";
import { handleWorldStateRoute } from "../../services/api/src/routes/world-state";
import { handleWorldJobsRoute } from "../../services/api/src/routes/world-jobs";
import { handleSubmitActionRoute } from "../../services/api/src/routes/submit-action";
import { resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("full regression", () => {
  beforeEach(() => {
    resetSessionService();
    seedBridgeAgentForTests({ user_id: "user_release", agent_id: "agent_release" });
  });

  it("verifies skill bridge main chain", () => {
    const register = handleRegisterRoute({ body: { idempotency_key: "release_reg", skill_name: "openclaw_world_skill", user_id: "user_release", agent_id: "agent_release", skill_version: "0.1.0", local_digest: "release_digest", requested_capabilities: { register: true, claim: true, heartbeat: true, state: true, jobs: true, action: true, event_ack: true } } });
    expect(register.status).toBe(200);
    if (!register.body.ok) throw new Error("register failed");
    const registerData = register.body.data as { claim_token: string };

    const claim = handleClaimRoute({ body: { idempotency_key: "release_claim", claim_token: registerData.claim_token, skill_name: "openclaw_world_skill", agent_id: "agent_release", local_digest: "release_digest" } });
    expect(claim.status).toBe(200);
    if (!claim.body.ok) throw new Error("claim failed");
    const claimData = claim.body.data as { world_access_token: string; session_id: string };
    const auth = `Bearer ${claimData.world_access_token}`;

    const heartbeat = handleHeartbeatRoute({ headers: { authorization: auth }, body: { idempotency_key: "release_heartbeat", session_id: claimData.session_id, agent_id: "agent_release", tick_seen: 0, sent_at_seconds: 1, liveness: { cpu_ok: true, memory_ok: true, network_ok: true }, capabilities: { register: true, claim: true, heartbeat: true, state: true, jobs: true, action: true, event_ack: true }, local_digest: "release_digest", alerts: [] } });
    expect(heartbeat.status).toBe(200);

    const state = handleWorldStateRoute({ headers: { authorization: auth }, body: undefined });
    expect(state.status).toBe(200);

    const jobs = handleWorldJobsRoute({ headers: { authorization: auth }, body: undefined });
    expect(jobs.status).toBe(200);

    const action = handleSubmitActionRoute({ headers: { authorization: auth }, body: { idempotency_key: "release_action", agent_id: "agent_release", action_type: "move", tick_seen: 0, payload: { target_sector_id: "sector_0_1" } } });
    expect(action.status).toBe(200);
    if (!action.body.ok) throw new Error("action failed");
    const actionData = action.body.data as { accepted: boolean };
    expect(actionData.accepted).toBe(true);
  });
});
