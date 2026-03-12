import { beforeEach, describe, expect, it } from "vitest";
import { handleWorldHealthRoute } from "../../services/admin/src/routes/world-health";
import { resetAdminStore } from "../../services/admin/src/services/dashboard.service";
import { resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("world health report", () => {
  beforeEach(() => {
    resetSessionService();
    resetAdminStore();
    seedBridgeAgentForTests({ user_id: "user_health", agent_id: "agent_health" });
  });

  it("returns world, economy, organization, onboarding health", () => {
    const response = handleWorldHealthRoute({ headers: { "x-admin-token": "openclaw_admin_local_token" } });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    if (response.body.ok) {
      const data = response.body.data;
      if (!data) throw new Error("missing world health data");
      expect(data.world.world_id).toBeTruthy();
      expect(data.economy.total_credits).toBeGreaterThanOrEqual(0);
    }
  });
});
