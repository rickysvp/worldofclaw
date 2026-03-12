import { z } from "zod";
import { action_enum, event_kind_enum, event_level_enum } from "../constants/enums";
import {
  entity_meta_schema,
  json_record_schema,
  nullable_id_schema,
  short_text_schema,
  tick_schema
} from "../primitives/common";

export const event_schema = entity_meta_schema.extend({
  tick: tick_schema,
  kind: event_kind_enum,
  level: event_level_enum,
  action: action_enum.nullable().default(null),
  source_entity_id: nullable_id_schema,
  target_entity_id: nullable_id_schema,
  sector_id: nullable_id_schema,
  title: short_text_schema,
  message: z.string().min(1).max(2_000),
  error_code: z.string().min(1).max(64).nullable().default(null),
  payload: json_record_schema.default({})
});

export type WorldEvent = z.infer<typeof event_schema>;
