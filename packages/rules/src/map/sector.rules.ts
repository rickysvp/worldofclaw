import type { Sector, SectorAccessPolicy } from "../../../schemas/src";
import { terrain_default_slots } from "./map.constants";

export const getDefaultSectorAccessPolicy = (sector: Pick<Sector, "terrain_type">): SectorAccessPolicy =>
  sector.terrain_type === "safe_zone" ? "open" : "open";

export const getSectorFacilitySlotCount = (sector: Pick<Sector, "facility_slot_count" | "terrain_type">): number =>
  Math.min(3, Math.max(0, sector.facility_slot_count || terrain_default_slots[sector.terrain_type]));

export const hasAvailableFacilitySlot = (sector: Pick<Sector, "facility_ids" | "facility_slot_count" | "terrain_type">): boolean =>
  sector.facility_ids.length < getSectorFacilitySlotCount(sector);

export const isSectorBlocked = (sector: Pick<Sector, "blocked">): boolean => sector.blocked;

export const isSectorPubliclyVisible = (sector: Pick<Sector, "access_policy">): boolean => sector.access_policy !== "members_only";

export const canSectorFormLongTermControl = (sector: Pick<Sector, "facility_ids">): boolean => sector.facility_ids.length > 0;
