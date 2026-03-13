import { describe, expect, it } from "vitest";
import { buildDependencyMatrix, buildVersionManifest, buildPostdeployChecklist, evaluateEnvironmentReadiness, evaluateGoNoGo } from "../../packages/release/src";

describe("launch readiness", () => {
  it("builds release metadata and blocks on missing production env", () => {
    const manifest = buildVersionManifest("0.1.0", ["world-engine", "api", "admin", "platform"]);
    const matrix = buildDependencyMatrix();
    const readiness = evaluateEnvironmentReadiness("production", { OPENCLAW_ADMIN_TOKEN: "token" });
    const post = buildPostdeployChecklist({ smoke_ok: true, alerts_ok: true, billing_ok: true, sessions_ok: true });
    const decision = evaluateGoNoGo([post]);
    expect(manifest.version).toBe("0.1.0");
    expect(matrix.length).toBeGreaterThan(0);
    expect(readiness.ready).toBe(false);
    expect(decision.status).toBe("go");
  });
});
