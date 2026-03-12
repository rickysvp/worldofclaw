import type { Facility, Sector, WorldState } from "../../../schemas/src";
import { relay_visibility_bonus_by_level } from "./map.constants";

const expandRange = (worldState: WorldState, originSectorId: string, range: number): string[] => {
  const visited = new Set<string>([originSectorId]);
  let frontier = [originSectorId];

  for (let step = 0; step < range; step += 1) {
    const nextFrontier = new Set<string>();
    for (const sectorId of frontier) {
      for (const neighborId of worldState.indexes.neighbor_sector_ids[sectorId] ?? []) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          nextFrontier.add(neighborId);
        }
      }
    }
    frontier = [...nextFrontier];
  }

  return [...visited];
};

const getRelayBonus = (facilities: readonly Facility[], sectorId: string): number => {
  let bonus = 0;
  for (const facility of facilities) {
    if (facility.status !== "online") {
      continue;
    }
    if (facility.facility_type === "relay" && facility.sector_id === sectorId) {
      bonus = Math.max(bonus, facility.level * relay_visibility_bonus_by_level);
    }
  }
  return bonus;
};

export const getVisibleSectorIds = (worldState: WorldState, originSectorId: string): string[] => {
  const origin = worldState.registries.sectors[originSectorId];
  if (!origin) {
    return [];
  }

  const facilities = Object.values(worldState.registries.facilities);
  const terrainBonus = origin.terrain_type === "relay_highland" ? 1 : 0;
  const relayBonus = getRelayBonus(facilities, originSectorId);
  const visible = expandRange(worldState, originSectorId, 1 + terrainBonus + relayBonus);

  return visible;
};

export const canRevealFacilityDetails = (sector: Pick<Sector, "access_policy" | "controller_owner_user_id">, actorOwnerUserId: string | null): boolean => {
  if (sector.access_policy !== "members_only") {
    return true;
  }

  return sector.controller_owner_user_id !== null && sector.controller_owner_user_id === actorOwnerUserId;
};
