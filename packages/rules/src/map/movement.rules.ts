import type { Sector, WorldState } from "../../../schemas/src";
import { areSectorsAdjacent } from "./adjacency.rules";

export type MovementCheck = {
  allowed: boolean;
  error_code: "invalid_location" | "sector_not_adjacent" | "access_denied" | null;
};

export const canMoveBetweenSectors = (
  worldState: WorldState,
  fromSector: Sector,
  toSector: Sector,
  actorOwnerUserId: string | null
): MovementCheck => {
  if (toSector.blocked) {
    return { allowed: false, error_code: "invalid_location" };
  }

  if (!areSectorsAdjacent(worldState.indexes.neighbor_sector_ids, fromSector.id, toSector.id)) {
    return { allowed: false, error_code: "sector_not_adjacent" };
  }

  if (toSector.access_policy === "members_only" && toSector.controller_owner_user_id !== actorOwnerUserId) {
    return { allowed: false, error_code: "access_denied" };
  }

  if (toSector.access_policy === "restricted" && toSector.controller_owner_user_id && toSector.controller_owner_user_id !== actorOwnerUserId) {
    return { allowed: false, error_code: "access_denied" };
  }

  return { allowed: true, error_code: null };
};
