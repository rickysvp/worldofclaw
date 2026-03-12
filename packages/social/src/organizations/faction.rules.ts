import type { Facility } from "../../../schemas/src";
import { faction_min_average_trust, faction_min_members, faction_required_distinct_facility_types } from "../constants";
import type { OrganizationState, OrganizationTransition } from "../organization.types";
import type { SocialLedgerIntent, SocialRelation } from "../relation.types";
import { createOrganizationEvent, createSocialLedgerEntry } from "../relations/relation-events";
import { buildOrganizationMembers } from "./membership.rules";
import { deriveGovernance } from "./governance.rules";
import { deriveOrganizationTreasury } from "./treasury.rules";

const averageTrust = (relations: ReadonlyArray<SocialRelation>): number =>
  relations.length === 0 ? 0 : relations.reduce((sum, relation) => sum + relation.trust, 0) / relations.length;

const hasStableIncome = (ledger_entries: ReadonlyArray<SocialLedgerIntent>, organization_id: string, current_tick: number): boolean =>
  deriveOrganizationTreasury(organization_id, ledger_entries, current_tick).net_24h > 0;

export const canFormFaction = (input: {
  organization_id: string;
  member_agent_ids: string[];
  controlled_facilities: Facility[];
  internal_relations: SocialRelation[];
  treasury_ledger: SocialLedgerIntent[];
  has_access_difference: boolean;
  current_tick: number;
}): boolean =>
  input.member_agent_ids.length >= faction_min_members &&
  new Set(input.controlled_facilities.map((facility) => facility.facility_type)).size >= faction_required_distinct_facility_types &&
  hasStableIncome(input.treasury_ledger, input.organization_id, input.current_tick) &&
  averageTrust(input.internal_relations) >= faction_min_average_trust &&
  input.has_access_difference;

export const createFactionState = (input: {
  organization_id: string;
  name: string;
  founder_agent_id: string;
  member_agent_ids: string[];
  controlled_sector_ids: string[];
  controlled_facilities: Facility[];
  internal_relations: SocialRelation[];
  treasury_ledger: SocialLedgerIntent[];
  tick: number;
}): OrganizationTransition => {
  const next_state: OrganizationState = {
    organization_id: input.organization_id,
    organization_type: "faction",
    name: input.name,
    members: buildOrganizationMembers({
      member_agent_ids: input.member_agent_ids,
      founder_agent_id: input.founder_agent_id,
      joined_at_tick: input.tick
    }),
    controlled_sector_ids: input.controlled_sector_ids,
    controlled_facility_ids: input.controlled_facilities.map((facility) => facility.id),
    controlled_facility_types: [...new Set(input.controlled_facilities.map((facility) => facility.facility_type))],
    treasury: deriveOrganizationTreasury(input.organization_id, input.treasury_ledger, input.tick),
    governance: deriveGovernance("faction"),
    health: {
      cohesion: Math.round(averageTrust(input.internal_relations)),
      stability: 75,
      split_risk: 15,
      dissolve_risk: 5
    },
    runtime: {
      founder_agent_id: input.founder_agent_id,
      maintainer_agent_ids: [],
      trader_agent_ids: [],
      guest_agent_ids: [],
      formed_at_tick: input.tick,
      last_active_tick: input.tick,
      access_mode: "members_only"
    }
  };

  return {
    next_state,
    events: [
      createOrganizationEvent({
        code: "organization_faction_formed",
        tick: input.tick,
        organization_id: input.organization_id,
        actor_id: input.founder_agent_id,
        summary: `${input.name} formed as a faction`,
        metadata: {
          member_count: input.member_agent_ids.length,
          controlled_sector_count: input.controlled_sector_ids.length,
          controlled_facility_count: input.controlled_facilities.length
        }
      })
    ],
    ledger_entries: [
      createSocialLedgerEntry({
        entity_id: input.organization_id,
        tick: input.tick,
        credits_delta: 0,
        note: "organization_faction_formed",
        payload: {
          founder_agent_id: input.founder_agent_id,
          member_count: input.member_agent_ids.length
        }
      })
    ]
  };
};
