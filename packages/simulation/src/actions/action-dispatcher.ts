import type { NormalizedPendingAction } from "../../../schemas/src";
import type { TickAccumulator, TickContext } from "../tick-context";
import type { ActionResolver, RandomIntFn } from "./action.types";
import { moveResolver } from "./resolvers/move.resolver";
import { scanResolver } from "./resolvers/scan.resolver";
import { salvageResolver } from "./resolvers/salvage.resolver";
import { mineMeteorResolver } from "./resolvers/mine-meteor.resolver";
import { tradeResolver } from "./resolvers/trade.resolver";
import { chargeResolver } from "./resolvers/charge.resolver";
import { repairResolver } from "./resolvers/repair.resolver";
import { craftResolver } from "./resolvers/craft.resolver";
import { refineResolver } from "./resolvers/refine.resolver";
import { escortResolver } from "./resolvers/escort.resolver";
import { attackResolver } from "./resolvers/attack.resolver";
import { buildResolver } from "./resolvers/build.resolver";
import { claimResolver } from "./resolvers/claim.resolver";

const action_resolvers: Record<NormalizedPendingAction["action_type"], ActionResolver> = {
  move: moveResolver,
  scan: scanResolver,
  salvage: salvageResolver,
  mine_meteor: mineMeteorResolver,
  trade: tradeResolver,
  charge: chargeResolver,
  repair: repairResolver,
  craft: craftResolver,
  refine: refineResolver,
  escort: escortResolver,
  attack: attackResolver,
  build: buildResolver,
  claim: claimResolver
};

export const dispatchActionResolver = (
  accumulator: TickAccumulator,
  context: TickContext,
  action: NormalizedPendingAction,
  random_int: RandomIntFn
): TickAccumulator => action_resolvers[action.action_type](accumulator, context, action, random_int);
