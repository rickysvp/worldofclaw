import { faction_income_window_ticks } from "../constants";
import type { OrganizationTreasury } from "../organization.types";
import type { SocialLedgerIntent } from "../relation.types";

export const deriveOrganizationTreasury = (
  organization_id: string,
  ledger_entries: ReadonlyArray<SocialLedgerIntent>,
  current_tick?: number,
  window_ticks = faction_income_window_ticks
): OrganizationTreasury => {
  const entries = ledger_entries.filter((entry) => entry.entity_id === organization_id);
  const effective_tick = current_tick ?? entries.reduce((max_tick, entry) => Math.max(max_tick, entry.tick), 0);
  const windowed_entries = entries.filter((entry) => effective_tick - entry.tick < window_ticks);
  const credits = entries.reduce((sum, entry) => sum + entry.credits_delta, 0);
  const income_24h = windowed_entries.filter((entry) => entry.credits_delta > 0).reduce((sum, entry) => sum + entry.credits_delta, 0);
  const expense_24h = Math.abs(windowed_entries.filter((entry) => entry.credits_delta < 0).reduce((sum, entry) => sum + entry.credits_delta, 0));
  return {
    credits,
    income_24h,
    expense_24h,
    net_24h: income_24h - expense_24h
  };
};
