import type { ActionType } from "../../../schemas/src";

const actionPowerCost: Record<ActionType, number> = {
  move: 1,
  scan: 1,
  salvage: 1,
  mine_meteor: 2,
  trade: 0,
  charge: 0,
  repair: 1,
  craft: 1,
  refine: 1,
  escort: 1,
  attack: 2,
  build: 1,
  claim: 1
};

export const getActionPowerCostRule = (actionType: ActionType): number => actionPowerCost[actionType];
