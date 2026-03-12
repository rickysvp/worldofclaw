import { z } from "zod";
import { sector_access_policy_enum, sector_control_state_enum, terrain_enum } from "../constants/enums";
import {
  coordinate_x_schema,
  coordinate_y_schema,
  entity_meta_schema,
  id_list_schema,
  level_schema,
  nullable_id_schema,
  signed_int_schema
} from "../primitives/common";
import { inventory_schema } from "./agent.schema";

export const sector_resource_pool_schema = inventory_schema.default({
  power: 0,
  scrap: 5,
  composite: 0,
  circuit: 0,
  flux: 0,
  xenite: 0,
  compute_core: 0,
  credits: 0
});

export const sector_resource_regen_schema = inventory_schema.default({
  power: 0,
  scrap: 0,
  composite: 0,
  circuit: 0,
  flux: 0,
  xenite: 0,
  compute_core: 0,
  credits: 0
});

export const sector_schema = entity_meta_schema.extend({
  x: coordinate_x_schema,
  y: coordinate_y_schema,
  terrain_type: terrain_enum,
  danger_level: level_schema,
  route_level: level_schema.default(0),
  weather_modifier: signed_int_schema.default(0),
  signal_modifier: signed_int_schema.default(0),
  discoverability: level_schema.default(0),
  salvage_yield_rating: level_schema.default(0),
  power_signal_rating: level_schema.default(0),
  blocked: z.boolean().default(false),
  facility_slot_count: z.number().int().min(0).max(3).default(0),
  access_policy: sector_access_policy_enum.default("open"),
  control_state: sector_control_state_enum.default("uncontrolled"),
  controller_owner_user_id: nullable_id_schema.default(null),
  control_since_tick: z.number().int().min(0).nullable().default(null),
  contested_since_tick: z.number().int().min(0).nullable().default(null),
  hostile_conflict_ticks: z.array(z.number().int().min(0)).default([]),
  resource_stock: sector_resource_pool_schema,
  resource_regen: sector_resource_regen_schema,
  facility_ids: id_list_schema,
  occupant_agent_ids: id_list_schema,
  controlling_contract_id: nullable_id_schema
});

export type Sector = z.infer<typeof sector_schema>;
