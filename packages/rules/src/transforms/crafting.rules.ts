import type { ResourceType } from "../../../schemas/src";
import type { ResourceBag } from "../resources/resource.types";

export type CraftRecipe = {
  input: Partial<Record<ResourceType, number>>;
  output: Partial<Record<ResourceType, number>>;
};

export const getCraftRecipe = (outputResource: ResourceType): CraftRecipe | null => {
  if (outputResource === "circuit") {
    return {
      input: { scrap: 1, flux: 1 },
      output: { circuit: 1 }
    };
  }
  if (outputResource === "compute_core") {
    return {
      input: { composite: 1, circuit: 1 },
      output: { compute_core: 1 }
    };
  }
  return null;
};

export const canCraftResource = (bag: ResourceBag, outputResource: ResourceType): boolean => {
  const recipe = getCraftRecipe(outputResource);
  if (!recipe) {
    return false;
  }
  return Object.entries(recipe.input).every(([resourceType, amount]) => bag[resourceType as ResourceType] >= (amount ?? 0));
};
