import { z } from "zod";
import { facility_access_policy_enum, facility_enum, facility_status_enum } from "../constants/enums";
import {
  entity_meta_schema,
  id_list_schema,
  non_negative_int_schema,
  nullable_id_schema,
  tick_schema
} from "../primitives/common";
import { inventory_schema } from "./agent.schema";

export const facility_schema = entity_meta_schema
  .extend({
    owner_user_id: nullable_id_schema.default(null),
    owner_agent_id: nullable_id_schema.default(null),
    operator_agent_id: nullable_id_schema.default(null),
    sector_id: z.string().min(1).max(128),
    facility_type: facility_enum,
    status: facility_status_enum,
    access_policy: facility_access_policy_enum.default("restricted"),
    public_use: z.boolean().default(false),
    level: non_negative_int_schema,
    durability: non_negative_int_schema,
    durability_max: non_negative_int_schema,
    disabled_at_tick: tick_schema.nullable().default(null),
    claimed_at_tick: tick_schema.nullable().default(null),
    power_buffer: non_negative_int_schema.default(0),
    power_capacity: non_negative_int_schema,
    storage_capacity: non_negative_int_schema,
    inventory: inventory_schema.default({
      power: 0,
      scrap: 0,
      composite: 0,
      circuit: 0,
      flux: 0,
      xenite: 0,
      compute_core: 0,
      credits: 0
    }),
    linked_sector_ids: id_list_schema
  })
  .superRefine((value, ctx) => {
    if (value.durability > value.durability_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durability"],
        message: "durability must be less than or equal to durability_max"
      });
    }
    if (value.power_buffer > value.power_capacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["power_buffer"],
        message: "power_buffer must be less than or equal to power_capacity"
      });
    }
    if (value.durability === 0 && value.status !== "disabled") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "status must be disabled when durability is zero"
      });
    }
  });

export type Facility = z.infer<typeof facility_schema>;
