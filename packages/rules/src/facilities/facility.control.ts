import type { Facility } from "../../../schemas/src";

export const isFacilityDisabled = (facility: Facility): boolean => facility.status === "disabled" || facility.durability <= 0;

export const normalizeFacilityControlState = (facility: Facility, tickNumber: number): Facility => {
  if (facility.durability > 0) {
    return facility;
  }

  return {
    ...facility,
    status: "disabled",
    disabled_at_tick: facility.disabled_at_tick ?? tickNumber,
    updated_at_tick: tickNumber
  };
};
