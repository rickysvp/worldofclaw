import { public_facility_repair_fame_max, public_facility_repair_fame_min } from "../constants";
import type { FacilityType } from "../../../schemas/src";
import type { ReputationRecord } from "../reputation.types";

const critical_facilities: FacilityType[] = ["generator", "shelter", "relay", "defense_node"];

export const getPublicFacilityRepairFameGain = (facility_type: FacilityType): number =>
  critical_facilities.includes(facility_type) ? public_facility_repair_fame_max : public_facility_repair_fame_min;

export const applyPublicRepairFame = (
  reputation: ReputationRecord,
  facility_type: FacilityType,
  tick: number
): ReputationRecord => ({
  ...reputation,
  fame: Math.min(100, reputation.fame + getPublicFacilityRepairFameGain(facility_type)),
  public_repairs: reputation.public_repairs + 1,
  updated_at_tick: tick
});
