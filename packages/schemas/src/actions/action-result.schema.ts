import { z } from "zod";
import { action_enum, action_error_code_enum, action_result_code_enum, action_status_enum } from "../constants/enums";
import { id_list_schema, id_schema, json_record_schema, short_text_schema, tick_schema } from "../primitives/common";

export const action_execution_result_schema = z.object({
  action_id: id_schema,
  agent_id: id_schema,
  action_type: action_enum,
  status: action_status_enum,
  success: z.boolean(),
  result_code: action_result_code_enum,
  error_code: action_error_code_enum.nullable().default(null),
  summary: short_text_schema,
  started_at_tick: tick_schema,
  finished_at_tick: tick_schema,
  event_ids: id_list_schema.default([]),
  ledger_ids: id_list_schema.default([]),
  effects: json_record_schema.default({})
});

export const resolved_action_schema = action_execution_result_schema;

export type ActionExecutionResult = z.infer<typeof action_execution_result_schema>;
export type ResolvedActionRecord = z.infer<typeof resolved_action_schema>;
