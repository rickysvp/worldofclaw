import type { Facility } from "../../../schemas/src";

export const generator_maintenance_interval_ticks = 12;
export const generator_maintenance_scrap_cost = 1;

export const applyFacilityMaintenance = (facility: Facility, tickNumber: number): {
  facility: Facility;
  consumed_scrap: number;
  maintenance_due: boolean;
} => {
  if (facility.facility_type !== "generator") {
    return { facility, consumed_scrap: 0, maintenance_due: false };
  }

  const maintenanceDue = tickNumber > 0 && tickNumber % generator_maintenance_interval_ticks === 0;
  if (!maintenanceDue) {
    return { facility, consumed_scrap: 0, maintenance_due: false };
  }

  const next: Facility = structuredClone(facility);
  if (next.inventory.scrap >= generator_maintenance_scrap_cost) {
    next.inventory.scrap -= generator_maintenance_scrap_cost;
    next.updated_at_tick = tickNumber;
    return { facility: next, consumed_scrap: generator_maintenance_scrap_cost, maintenance_due: true };
  }

  next.durability = Math.max(0, next.durability - 1);
  if (next.durability === 0) {
    next.status = "disabled";
    next.disabled_at_tick = tickNumber;
  }
  next.updated_at_tick = tickNumber;
  return { facility: next, consumed_scrap: 0, maintenance_due: true };
};
