import { z } from "zod";
import { facility_enum, resource_enum } from "../constants/enums";
import { id_schema, non_negative_int_schema, nullable_id_schema } from "../primitives/common";

export const trade_side_enum = z.enum(["buy", "sell"]);
export const claim_target_kind_enum = z.enum(["sector", "facility"]);
export const actionable_resource_enum = z.enum([
  "scrap",
  "composite",
  "circuit",
  "flux",
  "xenite",
  "compute_core"
]);

export const move_action_payload_schema = z.object({
  target_sector_id: id_schema
});

export const scan_action_payload_schema = z.object({}).strict();
export const salvage_action_payload_schema = z.object({}).strict();

export const mine_meteor_action_payload_schema = z.object({
  preferred_resource_type: actionable_resource_enum.nullable().default(null)
});

export const trade_action_payload_schema = z.object({
  trade_side: trade_side_enum,
  trade_resource_type: actionable_resource_enum,
  trade_amount: non_negative_int_schema,
  unit_price: non_negative_int_schema
});

export const charge_action_payload_schema = z.object({
  facility_id: id_schema
});

export const repair_action_payload_schema = z.object({
  facility_id: nullable_id_schema.default(null)
});

export const craft_action_payload_schema = z.object({
  preferred_resource_type: resource_enum.nullable().default(null)
});

export const refine_action_payload_schema = z.object({}).strict();

export const escort_action_payload_schema = z.object({
  target_agent_id: id_schema
});

export const attack_action_payload_schema = z.object({
  target_agent_id: id_schema
});

export const build_action_payload_schema = z.object({
  build_facility_type: facility_enum
});

export const claim_action_payload_schema = z.object({
  claim_target_kind: claim_target_kind_enum,
  claim_target_id: nullable_id_schema.default(null)
});

export const default_action_payload_schema = z.object({}).passthrough();

export type MoveActionPayload = z.infer<typeof move_action_payload_schema>;
export type ScanActionPayload = z.infer<typeof scan_action_payload_schema>;
export type SalvageActionPayload = z.infer<typeof salvage_action_payload_schema>;
export type MineMeteorActionPayload = z.infer<typeof mine_meteor_action_payload_schema>;
export type TradeActionPayload = z.infer<typeof trade_action_payload_schema>;
export type ChargeActionPayload = z.infer<typeof charge_action_payload_schema>;
export type RepairActionPayload = z.infer<typeof repair_action_payload_schema>;
export type CraftActionPayload = z.infer<typeof craft_action_payload_schema>;
export type RefineActionPayload = z.infer<typeof refine_action_payload_schema>;
export type EscortActionPayload = z.infer<typeof escort_action_payload_schema>;
export type AttackActionPayload = z.infer<typeof attack_action_payload_schema>;
export type BuildActionPayload = z.infer<typeof build_action_payload_schema>;
export type ClaimActionPayload = z.infer<typeof claim_action_payload_schema>;
