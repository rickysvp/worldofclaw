import type { Facility } from "../../../schemas/src";

export const canClaimFacility = (facility: Facility, actorOwnerUserId: string | null): boolean => {
  if (facility.status === "disabled") {
    return false;
  }

  return facility.owner_user_id !== actorOwnerUserId;
};

export const claimFacilityOwnership = (
  facility: Facility,
  ownerUserId: string | null,
  ownerAgentId: string,
  tickNumber: number
): Facility => ({
  ...facility,
  owner_user_id: ownerUserId,
  owner_agent_id: ownerAgentId,
  claimed_at_tick: tickNumber,
  updated_at_tick: tickNumber
});
