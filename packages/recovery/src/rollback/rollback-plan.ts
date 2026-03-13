import type { RollbackPlan } from "../recovery.types";

export const buildRollbackPlan = (target_tick: number): RollbackPlan => ({
  plan_id: `rollback_${target_tick}`,
  target_tick,
  steps: [
    "freeze write traffic",
    "load nearest verified snapshot",
    "restore world state",
    "replay pending queue if safe",
    "verify checksums and reopen traffic"
  ]
});
