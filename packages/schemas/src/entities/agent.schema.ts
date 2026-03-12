import { z } from "zod";
import { agent_status_enum, resource_values } from "../constants/enums";
import {
  entity_meta_schema,
  id_list_schema,
  json_record_schema,
  level_schema,
  non_negative_credits_schema,
  non_negative_int_schema,
  nullable_id_schema,
  short_text_schema,
  signed_int_schema
} from "../primitives/common";

export const inventory_schema = z
  .object({
    power: non_negative_int_schema.default(0),
    scrap: non_negative_int_schema.default(0),
    composite: non_negative_int_schema.default(0),
    circuit: non_negative_int_schema.default(0),
    flux: non_negative_int_schema.default(0),
    xenite: non_negative_int_schema.default(0),
    compute_core: non_negative_int_schema.default(0),
    credits: non_negative_credits_schema.default(0)
  })
  .strict();

export const agent_schema = entity_meta_schema
  .extend({
    owner_user_id: nullable_id_schema,
    external_agent_id: nullable_id_schema,
    name: short_text_schema,
    location: z.string().min(1).max(128),
    status: agent_status_enum,
    power: non_negative_int_schema,
    power_max: non_negative_int_schema,
    durability: non_negative_int_schema,
    durability_max: non_negative_int_schema,
    compute: non_negative_int_schema,
    compute_max: non_negative_int_schema,
    cargo_used: non_negative_int_schema,
    cargo_max: non_negative_int_schema,
    credits: non_negative_credits_schema,
    trust: signed_int_schema,
    threat: signed_int_schema,
    bond: signed_int_schema,
    shelter_level: level_schema,
    access_level: level_schema,
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
    skills: id_list_schema,
    affiliations: id_list_schema,
    runtime_flags: json_record_schema.default({})
  })
  .superRefine((value, ctx) => {
    if (value.power > value.power_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["power"],
        message: "power must be less than or equal to power_max"
      });
    }
    if (value.durability > value.durability_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durability"],
        message: "durability must be less than or equal to durability_max"
      });
    }
    if (value.compute > value.compute_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compute"],
        message: "compute must be less than or equal to compute_max"
      });
    }
    if (value.cargo_used > value.cargo_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cargo_used"],
        message: "cargo_used must be less than or equal to cargo_max"
      });
    }

    for (const resource_key of resource_values) {
      if (value.inventory[resource_key] < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inventory", resource_key],
          message: "inventory resource values must be non-negative"
        });
      }
    }
  });

export type Inventory = z.infer<typeof inventory_schema>;
export type Agent = z.infer<typeof agent_schema>;
