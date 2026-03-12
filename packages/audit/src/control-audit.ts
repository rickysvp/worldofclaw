import { deriveSectorControlSummary } from "../../rules/src/map/control.rules";
import type { ControlAuditResult } from "./audit.types";
import type { WorldState } from "../../schemas/src";

export const auditControlState = (world_state: WorldState): ControlAuditResult => {
  const issues: string[] = [];
  const sectors = Object.values(world_state.registries.sectors);
  const facilities = Object.values(world_state.registries.facilities);
  const events = Object.values(world_state.registries.events);

  for (const sector of sectors) {
    const sectorFacilities = facilities.filter((facility) => facility.sector_id === sector.id);
    const derived = deriveSectorControlSummary(sector, sectorFacilities, events, world_state.meta.current_tick);
    if (derived.control_state !== sector.control_state || derived.controller_owner_user_id !== sector.controller_owner_user_id) {
      issues.push(`sector ${sector.id} control drift detected`);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    sectors,
    facilities
  };
};
