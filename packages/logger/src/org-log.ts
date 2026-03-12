import type { OrganizationTransition } from "../../social/src/organization.types";
import type { WorldLogEntry } from "./log.types";

export const createOrgLog = (world_id: string, tick: number, transition: OrganizationTransition): WorldLogEntry => ({
  log_id: `log_org_${transition.next_state.organization_id}_${tick}`,
  world_id,
  tick,
  timestamp: new Date(tick * 600_000).toISOString(),
  log_type: "org_log",
  entity_refs: {
    organization_ids: [transition.next_state.organization_id],
    agent_ids: transition.next_state.members.map((member) => member.agent_id),
    facility_ids: transition.next_state.controlled_facility_ids,
    sector_ids: transition.next_state.controlled_sector_ids
  },
  severity: "info",
  payload: {
    organization_type: transition.next_state.organization_type,
    member_count: transition.next_state.members.length,
    treasury_credits: transition.next_state.treasury.credits,
    event_count: transition.events.length,
    ledger_count: transition.ledger_entries.length
  },
  correlation_id: transition.next_state.organization_id
});
