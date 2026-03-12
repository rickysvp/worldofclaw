import type { Facility } from "../../../schemas/src";

export const canAccessFacility = (
  facility: Pick<Facility, "public_use" | "access_policy" | "owner_user_id" | "status">,
  actorOwnerUserId: string | null,
  actorIsMember = false
): boolean => {
  if (facility.status === "disabled") {
    return false;
  }

  if (facility.public_use || facility.access_policy === "public") {
    return true;
  }

  if (facility.owner_user_id && facility.owner_user_id === actorOwnerUserId) {
    return true;
  }

  if (facility.access_policy === "members_only" && actorIsMember) {
    return true;
  }

  return false;
};
