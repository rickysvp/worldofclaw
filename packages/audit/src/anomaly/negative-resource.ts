import type { AuditAlert } from "../audit.types";
import type { WorldState } from "../../../schemas/src";

export const detectNegativeResourceAlerts = (world_state: WorldState): AuditAlert[] => {
  const alerts: AuditAlert[] = [];
  for (const sector of Object.values(world_state.registries.sectors)) {
    for (const [resource, value] of Object.entries(sector.resource_stock)) {
      if (value < 0) {
        alerts.push({
          alert_id: `alert_negative_${sector.id}_${resource}`,
          code: "NEGATIVE_RESOURCE",
          severity: "critical",
          tick: world_state.meta.current_tick,
          message: `sector ${sector.id} has negative ${resource}`,
          entity_refs: { sector_ids: [sector.id] },
          correlation_id: `negative_resource_${sector.id}`
        });
      }
    }
  }
  return alerts;
};
