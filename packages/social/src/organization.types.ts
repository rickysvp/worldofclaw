import type { FacilityType } from "../../schemas/src";
import type { SocialEventIntent, SocialLedgerIntent } from "./relation.types";
import type { organization_roles, organization_types } from "./constants";

export type OrganizationType = (typeof organization_types)[number];
export type OrganizationRole = (typeof organization_roles)[number];

export type OrganizationMember = {
  agent_id: string;
  role: OrganizationRole;
  joined_at_tick: number;
  trade_count: number;
  maintenance_count: number;
  defense_count: number;
};

export type OrganizationGovernance = {
  tax_rate_bps: number;
  service_fee_bps: number;
  treasury_split_bps: number;
};

export type OrganizationTreasury = {
  credits: number;
  income_24h: number;
  expense_24h: number;
  net_24h: number;
};

export type OrganizationHealth = {
  cohesion: number;
  stability: number;
  split_risk: number;
  dissolve_risk: number;
};

export type OrganizationRuntime = {
  founder_agent_id: string;
  maintainer_agent_ids: string[];
  trader_agent_ids: string[];
  guest_agent_ids: string[];
  formed_at_tick: number;
  last_active_tick: number;
  access_mode: "open" | "members_only";
};

export type OrganizationState = {
  organization_id: string;
  organization_type: OrganizationType;
  name: string;
  members: OrganizationMember[];
  controlled_sector_ids: string[];
  controlled_facility_ids: string[];
  controlled_facility_types: FacilityType[];
  treasury: OrganizationTreasury;
  governance: OrganizationGovernance;
  health: OrganizationHealth;
  runtime: OrganizationRuntime;
};

export type OrganizationTransition = {
  next_state: OrganizationState;
  events: SocialEventIntent[];
  ledger_entries: SocialLedgerIntent[];
};
