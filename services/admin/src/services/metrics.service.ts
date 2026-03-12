import { getQueuedActionsForAdmin, getWorldState } from "../../../api/src/services/session.service";
import { getOverview } from "./dashboard.service";

export const getAdminMetrics = () => {
  const overview = getOverview();
  const world_state = getWorldState();
  return {
    overview,
    processed_receipts: Object.keys(world_state.meta.processed_tick_receipts).length,
    queued_action_count: getQueuedActionsForAdmin().length
  };
};
