import { beforeEach, describe, expect, it } from "vitest";
import { handleAlertsRoute } from "../../services/admin/src/routes/alerts";
import { handleOverviewRoute } from "../../services/admin/src/routes/overview";
import { handleClaimRoute } from "../../services/api/src/routes/claim";
import { handleHeartbeatRoute } from "../../services/api/src/routes/heartbeat";
import { handleRegisterRoute } from "../../services/api/src/routes/register";
import { resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("skill bridge readiness", () => {
  beforeEach(() => {
    resetSessionService();
    seedBridgeAgentForTests({ user_id: "user_skill_release", agent_id: "agent_skill_release" });
  });

  it("confirms skill bridge and admin monitoring stay healthy", () => {
    const register = handleRegisterRoute({ body: { idempotency_key: "skill_rel_reg", skill_name: "openclaw_world_skill", user_id: "user_skill_release", agent_id: "agent_skill_release", skill_version: "0.1.0", local_digest: "skill_release", requested_capabilities: { register: true, claim: true, heartbeat: true, state: true, jobs: true, action: true, event_ack: true } } });
    if (!register.body.ok) throw new Error("register failed");
    const registerData = register.body.data as { claim_token: string };
    const claim = handleClaimRoute({ body: { idempotency_key: "skill_rel_claim", claim_token: registerData.claim_token, skill_name: "openclaw_world_skill", agent_id: "agent_skill_release", local_digest: "skill_release" } });
    if (!claim.body.ok) throw new Error("claim failed");
    const claimData = claim.body.data as { world_access_token: string; session_id: string };
    const heartbeat = handleHeartbeatRoute({ headers: { authorization: `Bearer ${claimData.world_access_token}` }, body: { idempotency_key: "skill_rel_heartbeat", session_id: claimData.session_id, agent_id: "agent_skill_release", tick_seen: 0, sent_at_seconds: 1, liveness: { cpu_ok: true, memory_ok: true, network_ok: true }, capabilities: { register: true, claim: true, heartbeat: true, state: true, jobs: true, action: true, event_ack: true }, local_digest: "skill_release", alerts: [] } });
    expect(heartbeat.status).toBe(200);
    const overview = handleOverviewRoute({ headers: { "x-admin-token": "openclaw_admin_local_token" } });
    const alerts = handleAlertsRoute({ headers: { "x-admin-token": "openclaw_admin_local_token" } });
    expect(overview.status).toBe(200);
    expect(alerts.status).toBe(200);
  });
});
