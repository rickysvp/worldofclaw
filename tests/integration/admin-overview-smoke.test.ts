import { beforeEach, describe, expect, it } from "vitest";
import { handleOverviewRoute } from "../../services/admin/src/routes/overview";
import { resetAdminStore } from "../../services/admin/src/services/dashboard.service";
import { resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("admin overview smoke", () => {
  beforeEach(() => {
    resetSessionService();
    resetAdminStore();
    seedBridgeAgentForTests({ user_id: "user_admin", agent_id: "agent_admin" });
  });

  it("returns overview metrics", () => {
    const response = handleOverviewRoute({ headers: { "x-admin-token": "openclaw_admin_local_token" } });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    if (response.body.ok) {
      const data = response.body.data;
      if (!data) throw new Error("missing overview data");
      expect(data.agent_count).toBeGreaterThan(0);
    }
  });
});
