import {
  detectControlDriftAlerts,
  detectDoubleSettlementAlerts,
  detectNegativeResourceAlerts,
  detectPriceShockAlerts,
  detectStaleSessionAlerts,
  queue_backlog_warn_threshold,
  newbie_failure_ratio_threshold,
  type AuditAlert
} from "../../../../packages/audit/src";
import { getSessionsForAdmin, getWorldState, getQueuedActionsForAdmin } from "../../../api/src/services/session.service";

export const getActiveAlerts = (): AuditAlert[] => {
  const world_state = getWorldState();
  const sessions = getSessionsForAdmin();
  const alerts: AuditAlert[] = [
    ...detectNegativeResourceAlerts(world_state),
    ...detectDoubleSettlementAlerts(Object.values(world_state.registries.market_trades), world_state.meta.current_tick),
    ...detectStaleSessionAlerts(sessions, world_state.meta.current_tick),
    ...detectPriceShockAlerts(Object.values(world_state.registries.market_quotes), world_state.meta.current_tick),
    ...detectControlDriftAlerts(world_state)
  ];

  const queued_actions = getQueuedActionsForAdmin();
  if (queued_actions.length > queue_backlog_warn_threshold) {
    alerts.push({
      alert_id: `alert_queue_${world_state.meta.current_tick}`,
      code: "QUEUE_BACKLOG",
      severity: "warn",
      tick: world_state.meta.current_tick,
      message: `queued action backlog is ${queued_actions.length}`,
      entity_refs: {},
      correlation_id: "queue_backlog"
    });
  }

  const newbies = Object.values(world_state.registries.agents).filter((agent) => Number(agent.runtime_flags.safe_until_tick ?? -1) >= world_state.meta.current_tick);
  const failures = newbies.filter((agent) => agent.power <= 2 || agent.durability <= 5);
  if (newbies.length > 0 && failures.length / newbies.length >= newbie_failure_ratio_threshold) {
    alerts.push({
      alert_id: `alert_newbie_${world_state.meta.current_tick}`,
      code: "NEWBIE_FAILURE_SPIKE",
      severity: "warn",
      tick: world_state.meta.current_tick,
      message: `newbie failure spike detected: ${failures.length}/${newbies.length}`,
      entity_refs: { agent_ids: failures.map((agent) => agent.id) },
      correlation_id: "newbie_failure_spike"
    });
  }

  const receipt_ticks = Object.values(world_state.meta.processed_tick_receipts).map((receipt) => receipt.tick_number);
  const max_tick = receipt_ticks.length > 0 ? Math.max(...receipt_ticks) : 0;
  if (world_state.meta.current_tick - max_tick > 1) {
    alerts.push({
      alert_id: `alert_tick_stall_${world_state.meta.current_tick}`,
      code: "TICK_STALL",
      severity: "error",
      tick: world_state.meta.current_tick,
      message: "tick processing appears stalled",
      entity_refs: {},
      correlation_id: "tick_stall"
    });
  }

  return alerts;
};
