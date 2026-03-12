import { z } from "zod";
import { numeric_bounds } from "../constants/world.constants";

export const id_schema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9_:-]+$/);

export const tick_schema = z
  .number()
  .int()
  .min(numeric_bounds.tick_min)
  .max(numeric_bounds.tick_max);

export const version_schema = z
  .number()
  .int()
  .min(numeric_bounds.version_min)
  .max(numeric_bounds.version_max);

export const non_negative_int_schema = z
  .number()
  .int()
  .min(numeric_bounds.stat_min)
  .max(numeric_bounds.stat_max);

export const non_negative_credits_schema = z
  .number()
  .int()
  .min(numeric_bounds.credits_min)
  .max(numeric_bounds.credits_max);

export const signed_int_schema = z
  .number()
  .int()
  .min(numeric_bounds.signed_stat_min)
  .max(numeric_bounds.signed_stat_max);

export const coordinate_x_schema = z
  .number()
  .int()
  .min(numeric_bounds.coordinate_min)
  .max(numeric_bounds.coordinate_max_x);

export const coordinate_y_schema = z
  .number()
  .int()
  .min(numeric_bounds.coordinate_min)
  .max(numeric_bounds.coordinate_max_y);

export const level_schema = z
  .number()
  .int()
  .min(numeric_bounds.level_min)
  .max(numeric_bounds.level_max);

export const short_text_schema = z.string().min(1).max(256);
export const long_text_schema = z.string().min(1).max(4_000);
export const nullable_id_schema = id_schema.nullable();

export const json_scalar_schema = z.union([z.string(), z.number().int(), z.boolean()]);
export const json_record_schema = z.record(z.string(), json_scalar_schema);
export const string_list_schema = z.array(short_text_schema).default([]);
export const id_list_schema = z.array(id_schema).default([]);

export const entity_meta_schema = z.object({
  id: id_schema,
  version: version_schema,
  created_at_tick: tick_schema,
  updated_at_tick: tick_schema
});

export type StructuredValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type StructuredValidationResult<T> =
  | {
      ok: true;
      data: T;
      errors: [];
    }
  | {
      ok: false;
      data: null;
      errors: StructuredValidationIssue[];
    };

export const format_zod_error = (issues: z.ZodIssue[]): StructuredValidationIssue[] =>
  issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "$",
    code: issue.code,
    message: issue.message
  }));
