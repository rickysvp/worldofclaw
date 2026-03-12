import type { Facility } from "../../../schemas/src";
import { outpost_control_hold_ticks, outpost_min_active_agents, outpost_min_average_bond, outpost_optional_power_facilities, outpost_required_facilities } from "../constants";
import type { OrganizationState, OrganizationTransition } from "../organization.types";
import type { SocialLedgerIntent, SocialRelation } from "../relation.types";
import { createOrganizationEvent, createSocialLedgerEntry } from "../relations/relation-events";
import { buildOrganizationMembers } from "./membership.rules";
import { deriveGovernance } from "./governance.rules";
import { deriveOrganizationTreasury } from "./treasury.rules";

const averageBond = (relations: ReadonlyArray<SocialRelation>): number =>
  relations.length === 0 ? 0 : relations.reduce((sum, relation) => sum + relation.bond, 0) / relations.length;

const hasRequiredFacilities = (facilities: ReadonlyArray<Facility>): boolean => {
  const facility_types = new Set(facilities.map((facility) => facility.facility_type));
  return outpost_required_facilities.every((facility_type) => facility_types.has(facility_type)) &&
    outpost_optional_power_facilities.some((facility_type) => facility_types.has(facility_type));
};

export const canFormOutpost = (input: {
  active_agent_ids: string[];
  controlled_facilities: Facility[];
  internal_relations: SocialRelation[];
  internal_trade_net_positive: boolean;
  hold_ticks: number;
}): boolean =>
  input.active_agent_ids.length >= outpost_min_active_agents &&
  hasRequiredFacilities(input.controlled_facilities) &&
  input.internal_trade_net_positive &&
  input.hold_ticks >= outpost_control_hold_ticks &&
  averageBond(input.internal_relations) >= outpost_min_average_bond;

export const createOutpostState = (input: {
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
    organization_type: "outpost",
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
    governance: deriveGovernance("outpost"),
    health: {
      cohesion: Math.round(averageBond(input.internal_relations)),
      stability: 60,
      split_risk: 10,
      dissolve_risk: 10
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
        code: "organization_outpost_formed",
        tick: input.tick,
        organization_id: input.organization_id,
        actor_id: input.founder_agent_id,
        summary: `${input.name} formed as an outpost`,
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
        note: "organization_outpost_formed",
        payload: {
          founder_agent_id: input.founder_agent_id,
          member_count: input.member_agent_ids.length
        }
      })
    ]
  };
};
