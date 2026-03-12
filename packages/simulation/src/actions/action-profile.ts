import type { ActionType, FacilityType } from "../../../schemas/src";
import { getActionPowerCostRule, getFacilityBuildCost } from "../../../rules/src";

export const getActionPowerCost = (action_type: ActionType): number => getActionPowerCostRule(action_type);

export const getBuildScrapCost = (facility_type: FacilityType): number => getFacilityBuildCost(facility_type);
