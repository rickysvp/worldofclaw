import { canBuildFacilityOnTerrain, canPlaceFacilityInSector, getFacilityBuildCost } from "../../../../rules/src";
import { cloneState } from "../../utils/clone-state";
import { decreaseCargoUsed } from "../../utils/cargo";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import { createFacilityFromBuild } from "../../facilities/facility-factory";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const buildResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "build failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "build failed: insufficient power");
  }
  if (!action.build_facility_type) {
    return failAction(started.before, context, action, "invalid_action_payload", "build failed: build_facility_type missing");
  }

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const next_agent = next.world_state.registries.agents[agent.id];
  const sector = next.world_state.registries.sectors[agent.location];
  if (!next_agent || !sector) {
    return failAction(started.before, context, action, "target_missing", "build failed: sector missing");
  }

  const sector_facilities = Object.values(next.world_state.registries.facilities).filter((facility) => facility.sector_id === sector.id);
  const placement_check = canPlaceFacilityInSector(
    sector,
    sector_facilities,
    action.build_facility_type,
    sector.access_policy !== "restricted" || sector.controller_owner_user_id === agent.owner_user_id
  );
  if (!placement_check.allowed) {
    const result_code =
      placement_check.error_code === "slot_occupied"
        ? "build_limit_reached"
        : placement_check.error_code === "access_denied"
          ? "access_denied"
          : "invalid_location";
    return failAction(started.before, context, action, result_code, "build failed: placement rule denied");
  }
  if (!canBuildFacilityOnTerrain(action.build_facility_type, sector.terrain_type)) {
    return failAction(started.before, context, action, "invalid_location", "build failed: invalid terrain");
  }

  const scrap_cost = getFacilityBuildCost(action.build_facility_type);
  if (next_agent.inventory.scrap < scrap_cost) {
    return failAction(started.before, context, action, "insufficient_resources", "build failed: insufficient scrap");
  }

  next_agent.inventory.scrap -= scrap_cost;
  decreaseCargoUsed(next_agent, scrap_cost);
  next_agent.status = "operating";
  next_agent.updated_at_tick = context.tick_number;

  const existing_count = Object.keys(next.world_state.registries.facilities).length;
  const facility_id = `facility_${action.build_facility_type}_${context.tick_number}_${String(existing_count + 1).padStart(3, "0")}`;
  next.world_state.registries.facilities[facility_id] = createFacilityFromBuild(
    facility_id,
    action.build_facility_type,
    agent.location,
    agent.owner_user_id,
    agent.id,
    context.tick_number
  );

  let result = appendLedgerEntry(next, {
    tick: context.tick_number,
    kind: "resource_delta",
    resource_type: "scrap",
    amount_delta: -scrap_cost,
    credits_delta: 0,
    entity_id: agent.id,
    counterparty_entity_id: facility_id,
    action_ref: action.id,
    note: "build consumed scrap",
    payload: {}
  });
  result = addActionEvent(
    result,
    context,
    action,
    "info",
    `agent ${agent.id} built ${action.build_facility_type} at ${agent.location}`,
    "action_applied"
  );

  return appendResolvedAction(started.before, result, action, true, "action_applied", "build applied", {
    facility_id,
    facility_type: action.build_facility_type
  });
};
