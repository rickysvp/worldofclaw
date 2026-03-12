import { repair_durability_gain, repair_power_cost, repair_scrap_cost } from "../costs/service.costs";

export const canRepairDurability = (input: {
  available_scrap: number;
  available_power: number;
  current_durability: number;
  durability_max: number;
}): boolean =>
  input.available_scrap >= repair_scrap_cost &&
  input.available_power >= repair_power_cost &&
  input.current_durability < input.durability_max;

export const calculateRepairOutcome = (input: {
  current_durability: number;
  durability_max: number;
}): { durability_gain: number } => ({
  durability_gain: Math.min(repair_durability_gain, Math.max(0, input.durability_max - input.current_durability))
});
