import { z } from "zod";
import { contract_kind_enum, contract_status_enum, resource_enum } from "../constants/enums";
import {
  entity_meta_schema,
  json_record_schema,
  non_negative_credits_schema,
  non_negative_int_schema,
  nullable_id_schema,
  tick_schema
} from "../primitives/common";

export const contract_terms_schema = z
  .object({
    credits_amount: non_negative_credits_schema.default(0),
    resource_type: resource_enum.nullable().default(null),
    resource_amount: non_negative_int_schema.default(0),
    duration_ticks: tick_schema.default(0),
    metadata: json_record_schema.default({})
  })
  .strict();

export const contract_schema = entity_meta_schema.extend({
  kind: contract_kind_enum,
  status: contract_status_enum,
  owner_user_id: nullable_id_schema,
  agent_id: nullable_id_schema,
  facility_id: nullable_id_schema,
  sector_id: nullable_id_schema,
  skill_id: nullable_id_schema,
  started_at_tick: tick_schema,
  expires_at_tick: tick_schema,
  terms: contract_terms_schema
});

export type ContractTerms = z.infer<typeof contract_terms_schema>;
export type WorldContract = z.infer<typeof contract_schema>;
