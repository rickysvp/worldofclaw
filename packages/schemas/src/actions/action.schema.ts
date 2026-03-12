import { z } from "zod";
import { action_enum, action_status_enum, facility_enum } from "../constants/enums";
import {
  actionable_resource_enum,
  claim_action_payload_schema,
  claim_target_kind_enum,
  trade_action_payload_schema,
  trade_side_enum,
  move_action_payload_schema,
  scan_action_payload_schema,
  salvage_action_payload_schema,
  mine_meteor_action_payload_schema,
  charge_action_payload_schema,
  repair_action_payload_schema,
  craft_action_payload_schema,
  refine_action_payload_schema,
  escort_action_payload_schema,
  attack_action_payload_schema,
  build_action_payload_schema,
  default_action_payload_schema
} from "./action-payloads.schema";
import {
  id_schema,
  non_negative_int_schema,
  nullable_id_schema,
  tick_schema
} from "../primitives/common";

const payload_schema_by_action = {
  move: move_action_payload_schema,
  scan: scan_action_payload_schema,
  salvage: salvage_action_payload_schema,
  mine_meteor: mine_meteor_action_payload_schema,
  trade: trade_action_payload_schema,
  charge: charge_action_payload_schema,
  repair: repair_action_payload_schema,
  craft: craft_action_payload_schema,
  refine: refine_action_payload_schema,
  escort: escort_action_payload_schema,
  attack: attack_action_payload_schema,
  build: build_action_payload_schema,
  claim: claim_action_payload_schema
} as const;

export const world_action_schema = z.object({
  id: id_schema,
  agent_id: id_schema,
  action_type: action_enum,
  status: action_status_enum,
  created_at_tick: tick_schema,
  scheduled_start_tick: tick_schema,
  expected_end_tick: tick_schema,
  payload: default_action_payload_schema,
  error_code: z.string().min(1).max(128).nullable().default(null)
}).superRefine((value, ctx) => {
  const payload_schema = payload_schema_by_action[value.action_type];
  const parsed = payload_schema.safeParse(value.payload);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payload", ...issue.path],
        message: issue.message
      });
    }
  }
});

export const pending_action_schema = z.object({
  id: id_schema,
  tick_number: tick_schema,
  agent_id: id_schema,
  action_type: action_enum,
  target_sector_id: nullable_id_schema.default(null),
  target_agent_id: nullable_id_schema.default(null),
  facility_id: nullable_id_schema.default(null),
  trade_side: trade_side_enum.nullable().default(null),
  trade_resource_type: actionable_resource_enum.nullable().default(null),
  trade_amount: non_negative_int_schema.default(0),
  unit_price: non_negative_int_schema.default(0),
  build_facility_type: facility_enum.nullable().default(null),
  claim_target_kind: claim_target_kind_enum.nullable().default(null),
  claim_target_id: nullable_id_schema.default(null),
  preferred_resource_type: actionable_resource_enum.nullable().default(null)
}).superRefine((value, ctx) => {
  const parsed = world_action_schema.safeParse(to_world_action(value));
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message
      });
    }
  }
});

export const normalize_action_payload = (action: z.infer<typeof pending_action_schema>) => {
  switch (action.action_type) {
    case "move":
      return { target_sector_id: action.target_sector_id };
    case "scan":
      return {};
    case "salvage":
      return {};
    case "mine_meteor":
      return { preferred_resource_type: action.preferred_resource_type };
    case "trade":
      return {
        trade_side: action.trade_side,
        trade_resource_type: action.trade_resource_type,
        trade_amount: action.trade_amount,
        unit_price: action.unit_price
      };
    case "charge":
      return { facility_id: action.facility_id };
    case "repair":
      return { facility_id: action.facility_id };
    case "craft":
      return { preferred_resource_type: action.preferred_resource_type };
    case "refine":
      return {};
    case "escort":
      return { target_agent_id: action.target_agent_id };
    case "attack":
      return { target_agent_id: action.target_agent_id };
    case "build":
      return { build_facility_type: action.build_facility_type };
    case "claim":
      return {
        claim_target_kind: action.claim_target_kind,
        claim_target_id: action.claim_target_id
      };
  }
};

export const to_world_action = (action: z.infer<typeof pending_action_schema>) => ({
  id: action.id,
  agent_id: action.agent_id,
  action_type: action.action_type,
  status: "queued" as const,
  created_at_tick: action.tick_number,
  scheduled_start_tick: action.tick_number,
  expected_end_tick: action.tick_number,
  payload: normalize_action_payload(action),
  error_code: null
});

export type PendingAction = z.input<typeof pending_action_schema>;
export type NormalizedPendingAction = z.infer<typeof pending_action_schema>;
export type WorldAction = z.infer<typeof world_action_schema>;
