import type { AuditAlert } from "../audit.types";
import type { WorldState } from "../../../schemas/src";
import { auditControlState } from "../control-audit";

export const detectControlDriftAlerts = (world_state: WorldState): AuditAlert[] => {
  const audit = auditControlState(world_state);
  return audit.issues.map((issue, index) => ({
    alert_id: `alert_control_${index}`,
    code: "CONTROL_DRIFT",
    severity: "warn",
    tick: world_state.meta.current_tick,
    message: issue,
    entity_refs: {},
    correlation_id: `control_drift_${index}`
  }));
};
