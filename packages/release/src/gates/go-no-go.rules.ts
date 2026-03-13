import type { ReleaseChecklist, ReleaseDecision } from "../release.types";

export const evaluateGoNoGo = (checklists: ReleaseChecklist[]): ReleaseDecision => {
  const items = checklists.flatMap((checklist) => checklist.items);
  const failed_checks = items.filter((item) => item.status === "fail").map((item) => item.check_id);
  const warnings = items.filter((item) => item.status === "warn").map((item) => item.check_id);
  return {
    status: failed_checks.length === 0 ? "go" : "no_go",
    failed_checks,
    warnings
  };
};
