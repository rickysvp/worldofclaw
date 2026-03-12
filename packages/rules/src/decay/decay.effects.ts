import type { Agent, Facility } from "../../../schemas/src";
import { decayVolatileFlux, getIdlePowerDecay, getLowDurabilityPenalty, getNightPenalty, getStoppedDurabilityPenalty, shouldBecomeWrecked } from "./decay.rules";

export const applyAgentPassiveDecay = (agent: Agent, options: { is_day: boolean; has_shelter: boolean; tick_number: number }): Agent => {
  const next: Agent = structuredClone(agent);
  const powerCost = getIdlePowerDecay() + getNightPenalty(options.is_day, options.has_shelter) + getLowDurabilityPenalty(next.durability);
  next.power = Math.max(0, next.power - powerCost);
  next.inventory.flux = decayVolatileFlux(next.inventory.flux);
  next.updated_at_tick = options.tick_number;

  if (next.power === 0 && next.status !== "wrecked") {
    const stoppedAtTick = Number(next.runtime_flags.stopped_at_tick ?? options.tick_number);
    next.runtime_flags = {
      ...next.runtime_flags,
      stopped_at_tick: stoppedAtTick,
      lifecycle_state: "stopped"
    };
    next.status = "stopped";
  }

  if (next.status === "stopped") {
    const stoppedTicks = options.tick_number - Number(next.runtime_flags.stopped_at_tick ?? options.tick_number);
    const durabilityPenalty = getStoppedDurabilityPenalty(stoppedTicks);
    if (durabilityPenalty > 0) {
      next.durability = Math.max(0, next.durability - durabilityPenalty);
    }
    if (next.durability === 0 || shouldBecomeWrecked(stoppedTicks)) {
      next.status = "wrecked";
      next.runtime_flags = {
        ...next.runtime_flags,
        lifecycle_state: "wrecked",
        wrecked_at_tick: options.tick_number
      };
    }
  }

  return next;
};

export const applyFacilityPassiveDecay = (facility: Facility, tickNumber: number): Facility => {
  const next: Facility = structuredClone(facility);
  next.inventory.flux = decayVolatileFlux(next.inventory.flux);
  if (next.status !== "online" && next.power_buffer > 0) {
    next.power_buffer = Math.max(0, next.power_buffer - 1);
    next.inventory.power = Math.max(0, next.inventory.power - 1);
  }
  next.updated_at_tick = tickNumber;
  return next;
};
