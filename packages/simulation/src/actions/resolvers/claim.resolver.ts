import { canClaimFacility, claimFacilityOwnership } from "../../../../rules/src";
import type { Agent, PendingAction, WorldContract } from "../../../../schemas/src";
import { cloneState } from "../../utils/clone-state";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

const createClaimContract = (
  action: PendingAction,
  context: { tick_number: number },
  agent: Agent,
  sector_id: string,
  facility_id: string | null
): WorldContract => ({
  id: `contract_claim_${context.tick_number}_${action.id}`,
  version: 1,
  created_at_tick: context.tick_number,
  updated_at_tick: context.tick_number,
  kind: facility_id ? "facility_access" : "resource_claim",
  status: "active",
  owner_user_id: agent.owner_user_id,
  agent_id: agent.id,
  facility_id,
  sector_id,
  skill_id: null,
  started_at_tick: context.tick_number,
  expires_at_tick: context.tick_number + 24,
  terms: {
    credits_amount: 0,
    resource_type: null,
    resource_amount: 0,
    duration_ticks: 24,
    metadata: {
      claim_target_kind: facility_id ? "facility" : "sector"
    }
  }
});

export const claimResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "claim failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "claim failed: insufficient power");
  }
  if (!action.claim_target_kind) {
    return failAction(started.before, context, action, "invalid_action_payload", "claim failed: claim_target_kind missing");
  }

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const next_agent = next.world_state.registries.agents[agent.id];
  if (!next_agent) {
    return failAction(started.before, context, action, "agent_unavailable", "claim failed: agent missing");
  }

  if (action.claim_target_kind === "sector") {
    const sector_id = action.claim_target_id ?? agent.location;
    const sector = next.world_state.registries.sectors[sector_id];
    if (!sector) {
      return failAction(started.before, context, action, "target_missing", "claim failed: sector missing");
    }
    if (sector.controlling_contract_id) {
      return failAction(started.before, context, action, "claim_exists", "claim failed: sector already claimed");
    }

    const contract = createClaimContract(action, context, agent, sector_id, null);
    next.world_state.registries.contracts[contract.id] = contract;
    sector.controlling_contract_id = contract.id;
    next_agent.status = "operating";
    next_agent.updated_at_tick = context.tick_number;

    const result = addActionEvent(
      next,
      context,
      action,
      "info",
      `agent ${agent.id} claimed sector ${sector_id}`,
      "action_applied"
    );

    return appendResolvedAction(started.before, result, action, true, "action_applied", "claim applied", {
      contract_id: contract.id,
      sector_id
    });
  }

  const facility_id = action.claim_target_id ?? action.facility_id;
  const facility = facility_id ? next.world_state.registries.facilities[facility_id] : null;
  if (!facility) {
    return failAction(started.before, context, action, "target_missing", "claim failed: facility missing");
  }
  if (!canClaimFacility(facility, agent.owner_user_id)) {
    return failAction(started.before, context, action, "claim_exists", "claim failed: facility already claimed");
  }

  const contract = createClaimContract(action, context, agent, facility.sector_id, facility.id);
  next.world_state.registries.contracts[contract.id] = contract;
  next.world_state.registries.facilities[facility.id] = claimFacilityOwnership(
    facility,
    agent.owner_user_id,
    agent.id,
    context.tick_number
  );
  next_agent.status = "operating";
  next_agent.updated_at_tick = context.tick_number;

  let result = appendLedgerEntry(next, {
    tick: context.tick_number,
    kind: "registry_change",
    resource_type: null,
    amount_delta: 0,
    credits_delta: 0,
    entity_id: facility.id,
    counterparty_entity_id: agent.id,
    action_ref: action.id,
    note: "facility ownership transferred",
    payload: {
      ...(facility.owner_user_id ? { previous_owner_user_id: facility.owner_user_id } : {}),
      ...(agent.owner_user_id ? { next_owner_user_id: agent.owner_user_id } : {})
    }
  });
  result = addActionEvent(
    result,
    context,
    action,
    "info",
    `agent ${agent.id} claimed facility ${facility.id}`,
    "action_applied"
  );
  return appendResolvedAction(started.before, result, action, true, "action_applied", "claim applied", {
    contract_id: contract.id,
    facility_id: facility.id
  });
};
