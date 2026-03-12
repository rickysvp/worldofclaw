import type { WorldHealthContext, WorldHealthReport } from "../audit.types";
import { detectNegativeResourceAlerts } from "../anomaly/negative-resource";
import { detectStaleSessionAlerts } from "../anomaly/stale-session";
import { detectControlDriftAlerts } from "../anomaly/control-drift";

export const buildWorldHealthReport = (context: WorldHealthContext): WorldHealthReport => {
  const alerts = [
    ...detectNegativeResourceAlerts(context.world_state),
    ...detectStaleSessionAlerts(context.sessions, context.world_state.meta.current_tick),
    ...detectControlDriftAlerts(context.world_state)
  ];

  return {
    world_id: context.world_state.meta.id,
    tick: context.world_state.meta.current_tick,
    receipts: Object.keys(context.world_state.meta.processed_tick_receipts).length,
    alerts,
    log_count: context.logs.length
  };
};
