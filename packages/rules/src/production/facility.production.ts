import type { Facility } from "../../../schemas/src";

export const generator_output_per_tick = 2;

export const produceFacilityResources = (facility: Facility): { facility: Facility; produced_power: number } => {
  if (facility.facility_type !== "generator" || facility.status !== "online") {
    return { facility, produced_power: 0 };
  }

  const next: Facility = structuredClone(facility);
  const producedPower = Math.min(generator_output_per_tick, Math.max(0, next.power_capacity - next.power_buffer));
  next.power_buffer += producedPower;
  next.inventory.power = Math.min(next.power_capacity, next.inventory.power + producedPower);
  return { facility: next, produced_power: producedPower };
};
