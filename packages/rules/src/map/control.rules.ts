import type { Facility, Sector, SectorAccessPolicy, SectorControlState, WorldEvent } from "../../../schemas/src";
import {
  CONTESTED_HOSTILE_THRESHOLD,
  CONTESTED_LOOKBACK_TICKS,
  CONTROL_HOLD_TICKS
} from "./map.constants";

export type SectorControlSummary = {
  control_state: SectorControlState;
  access_policy: SectorAccessPolicy;
  controller_owner_user_id: string | null;
  control_since_tick: number | null;
  contested_since_tick: number | null;
  hostile_conflict_ticks: number[];
};

const getRelevantConflictTicks = (events: readonly WorldEvent[], sectorId: string, currentTick: number): number[] => {
  const minimumTick = Math.max(0, currentTick - CONTESTED_LOOKBACK_TICKS + 1);
  const ticks = new Set<number>();

  for (const event of events) {
    if (event.action !== "attack" || event.sector_id !== sectorId || event.tick < minimumTick) {
      continue;
    }
    ticks.add(event.tick);
  }

  return [...ticks].sort((left, right) => left - right);
};

const getFacilityMajorityOwner = (facilities: readonly Facility[]): string | null => {
  const counts = new Map<string, number>();

  for (const facility of facilities) {
    if (!facility.owner_user_id || facility.status === "disabled") {
      continue;
    }
    counts.set(facility.owner_user_id, (counts.get(facility.owner_user_id) ?? 0) + 1);
  }

  let majorityOwner: string | null = null;
  let majorityCount = 0;

  for (const [ownerUserId, count] of counts.entries()) {
    if (count > majorityCount) {
      majorityOwner = ownerUserId;
      majorityCount = count;
    }
  }

  return majorityCount > facilities.length / 2 ? majorityOwner : null;
};

export const deriveSectorControlSummary = (
  sector: Sector,
  facilities: readonly Facility[],
  events: readonly WorldEvent[],
  currentTick: number
): SectorControlSummary => {
  const hostileConflictTicks = getRelevantConflictTicks(events, sector.id, currentTick);
  const hasContestedState = hostileConflictTicks.length >= CONTESTED_HOSTILE_THRESHOLD;

  if (hasContestedState) {
    return {
      control_state: "contested",
      access_policy: "restricted",
      controller_owner_user_id: sector.controller_owner_user_id,
      control_since_tick: sector.control_since_tick,
      contested_since_tick: sector.contested_since_tick ?? currentTick,
      hostile_conflict_ticks: hostileConflictTicks
    };
  }

  if (facilities.length === 0) {
    return {
      control_state: "uncontrolled",
      access_policy: sector.terrain_type === "safe_zone" ? "open" : sector.access_policy,
      controller_owner_user_id: null,
      control_since_tick: null,
      contested_since_tick: null,
      hostile_conflict_ticks: hostileConflictTicks
    };
  }

  const majorityOwner = getFacilityMajorityOwner(facilities);
  if (!majorityOwner) {
    return {
      control_state: "uncontrolled",
      access_policy: sector.terrain_type === "safe_zone" ? "open" : sector.access_policy,
      controller_owner_user_id: null,
      control_since_tick: null,
      contested_since_tick: null,
      hostile_conflict_ticks: hostileConflictTicks
    };
  }

  const controlSinceTick = sector.controller_owner_user_id === majorityOwner
    ? sector.control_since_tick ?? currentTick
    : currentTick;

  const heldLongEnough = currentTick - controlSinceTick >= CONTROL_HOLD_TICKS;

  return {
    control_state: heldLongEnough ? "controlled" : "uncontrolled",
    access_policy: sector.terrain_type === "safe_zone" ? "open" : heldLongEnough ? sector.access_policy : "open",
    controller_owner_user_id: majorityOwner,
    control_since_tick: controlSinceTick,
    contested_since_tick: null,
    hostile_conflict_ticks: hostileConflictTicks
  };
};
