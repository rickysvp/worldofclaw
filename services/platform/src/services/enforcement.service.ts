import { evaluateGuarantee, evaluateQuota, evaluateRateLimit, evaluateSuspension, evaluateThrottle } from "../../../../packages/risk/src/index";
import { getEffectiveEntitlements } from "./billing-admin.service";
import { collectUsageSnapshot } from "./metering.service";

type EnforcementRecord = {
  enforcement_id: string;
  account_id: string;
  action: "warning" | "temporary_throttle" | "feature_downgrade" | "suspend" | "ban" | "allow";
  reason_codes: string[];
  tick: number;
};

type EnforcementStore = {
  records: Map<string, EnforcementRecord[]>;
  dispute_counts: Map<string, number>;
  severe_breach_counts: Map<string, number>;
  repeated_overage_counts: Map<string, number>;
};

const createStore = (): EnforcementStore => ({ records: new Map(), dispute_counts: new Map(), severe_breach_counts: new Map(), repeated_overage_counts: new Map() });
let enforcement_store = createStore();

export const resetEnforcementService = (): void => {
  enforcement_store = createStore();
};

export const noteDisputeForEnforcement = (account_id: string): void => {
  enforcement_store.dispute_counts.set(account_id, (enforcement_store.dispute_counts.get(account_id) ?? 0) + 1);
};

export const releaseDisputeForEnforcement = (account_id: string): void => {
  enforcement_store.dispute_counts.set(account_id, Math.max(0, (enforcement_store.dispute_counts.get(account_id) ?? 0) - 1));
};

export const evaluateAccountEnforcement = (input: { account_id: string; tick: number }) => {
  const entitlements = getEffectiveEntitlements(input.account_id);
  const usage = collectUsageSnapshot(input.account_id);
  const rate = evaluateRateLimit(entitlements.action_api_rate_per_minute, usage.action_requests);
  const quota = evaluateQuota(usage.active_agents, entitlements.active_agent_quota, "ACTIVE_AGENT_QUOTA_EXCEEDED");
  if (quota.exceeded) {
    enforcement_store.repeated_overage_counts.set(input.account_id, (enforcement_store.repeated_overage_counts.get(input.account_id) ?? 0) + 1);
  }
  if (!rate.allowed) {
    enforcement_store.severe_breach_counts.set(input.account_id, (enforcement_store.severe_breach_counts.get(input.account_id) ?? 0) + 1);
  }
  const throttle = evaluateThrottle({ rate, quota });
  const suspension = evaluateSuspension({
    dispute_count: enforcement_store.dispute_counts.get(input.account_id) ?? 0,
    severe_breach_count: enforcement_store.severe_breach_counts.get(input.account_id) ?? 0,
    repeated_overage_count: enforcement_store.repeated_overage_counts.get(input.account_id) ?? 0
  });
  const guarantee = evaluateGuarantee({ suspended: suspension.action === "suspend" || suspension.action === "ban", downgraded: suspension.action === "feature_downgrade" });
  const action = suspension.action === "none" ? throttle.action : suspension.action;
  const record: EnforcementRecord = {
    enforcement_id: `enforcement_${input.account_id}_${input.tick}`,
    account_id: input.account_id,
    action,
    reason_codes: [...throttle.reason_codes, ...suspension.reason_codes, ...guarantee.reason_codes],
    tick: input.tick
  };
  enforcement_store.records.set(input.account_id, [...(enforcement_store.records.get(input.account_id) ?? []), record]);
  return structuredClone(record);
};

export const listEnforcementRecords = (account_id: string): EnforcementRecord[] => structuredClone(enforcement_store.records.get(account_id) ?? []);
