import { low_durability_penalty_per_tick, low_durability_threshold, night_no_shelter_penalty_per_tick, stopped_durability_penalty_after_ticks, stopped_durability_penalty_amount, wreck_after_stopped_ticks, idle_power_decay_per_tick, volatile_flux_decay_per_tick } from "./decay.constants";

export const getIdlePowerDecay = (): number => idle_power_decay_per_tick;

export const getNightPenalty = (isDay: boolean, hasShelter: boolean): number => (isDay || hasShelter ? 0 : night_no_shelter_penalty_per_tick);

export const getLowDurabilityPenalty = (durability: number): number => (durability < low_durability_threshold ? low_durability_penalty_per_tick : 0);

export const getStoppedDurabilityPenalty = (stoppedTicks: number): number =>
  stoppedTicks >= stopped_durability_penalty_after_ticks ? stopped_durability_penalty_amount : 0;

export const shouldBecomeWrecked = (stoppedTicks: number): boolean => stoppedTicks >= wreck_after_stopped_ticks;

export const decayVolatileFlux = (value: number): number => Math.max(0, value - volatile_flux_decay_per_tick);
