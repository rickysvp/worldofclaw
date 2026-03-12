import type { Facility } from "../../../schemas/src";

export const applyFacilityDamage = (facility: Facility, damage: number, tickNumber: number): Facility => {
  const nextDurability = Math.max(0, facility.durability - damage);
  return {
    ...facility,
    durability: nextDurability,
    status: nextDurability === 0 ? "disabled" : facility.status,
    disabled_at_tick: nextDurability === 0 ? facility.disabled_at_tick ?? tickNumber : facility.disabled_at_tick,
    updated_at_tick: tickNumber
  };
};
