export const refining_recipe = {
  xenite: 2,
  circuit: 1,
  power: 2,
  compute_core: 1,
  success_rate_percent: 80
} as const;

export const canRefineComputeCore = (inventory: {
  xenite: number;
  circuit: number;
  power: number;
}): boolean => inventory.xenite >= refining_recipe.xenite && inventory.circuit >= refining_recipe.circuit && inventory.power >= refining_recipe.power;

export const resolveRefiningAttempt = (rollPercent: number): { succeeded: boolean } => ({
  succeeded: rollPercent < refining_recipe.success_rate_percent
});
