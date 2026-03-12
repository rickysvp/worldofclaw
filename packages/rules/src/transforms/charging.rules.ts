import { charge_service_credit_cost, charge_service_power_gain } from "../costs/service.costs";

export const calculateChargeTransfer = (input: {
  available_facility_power: number;
  agent_power: number;
  agent_power_max: number;
  agent_credits: number;
}): {
  purchased_units: number;
  transferred_power: number;
  spent_credits: number;
} => {
  const neededPower = Math.max(0, input.agent_power_max - input.agent_power);
  const maxByNeed = Math.floor(neededPower / charge_service_power_gain);
  const hasPartialNeed = neededPower % charge_service_power_gain !== 0 && neededPower > 0;
  const ceilingNeedUnits = maxByNeed + (hasPartialNeed ? 1 : 0);
  const maxByFacility = Math.floor(input.available_facility_power / charge_service_power_gain);
  const maxByCredits = Math.floor(input.agent_credits / charge_service_credit_cost);
  const purchasedUnits = Math.min(ceilingNeedUnits, maxByFacility, maxByCredits);
  const transferredPower = Math.min(neededPower, purchasedUnits * charge_service_power_gain);
  return {
    purchased_units: purchasedUnits,
    transferred_power: transferredPower,
    spent_credits: purchasedUnits * charge_service_credit_cost
  };
};
