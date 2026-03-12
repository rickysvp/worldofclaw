import { z } from "zod";
import { ledger_entry_kind_enum, resource_enum } from "../constants/enums";
import {
  id_list_schema,
  id_schema,
  json_record_schema,
  non_negative_credits_schema,
  non_negative_int_schema,
  nullable_id_schema,
  signed_int_schema,
  tick_schema
} from "../primitives/common";
import { inventory_schema } from "../entities/agent.schema";

export const ledger_entry_schema = z.object({
  id: id_schema,
  tick: tick_schema,
  kind: ledger_entry_kind_enum,
  resource_type: resource_enum.nullable().default(null),
  amount_delta: signed_int_schema,
  credits_delta: signed_int_schema.default(0),
  entity_id: id_schema,
  counterparty_entity_id: nullable_id_schema,
  action_ref: z.string().min(1).max(128).nullable().default(null),
  note: z.string().min(1).max(512),
  payload: json_record_schema.default({})
});

export const ledgers_schema = z.object({
  resource_balances_by_entity: z.record(id_schema, inventory_schema).default({}),
  credits_balances_by_entity: z.record(id_schema, non_negative_credits_schema).default({}),
  entries: z.array(ledger_entry_schema).default([])
});

export type LedgerEntry = z.infer<typeof ledger_entry_schema>;
export type Ledgers = z.infer<typeof ledgers_schema>;
