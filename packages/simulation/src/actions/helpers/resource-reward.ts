import { createResourceLedgerEntryInput } from "../../../../rules/src";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import type { TickAccumulator } from "../../tick-context";
import type { PendingAction, ResourceType } from "../../../../schemas/src";

export const appendActionResourceReward = (
  accumulator: TickAccumulator,
  tick_number: number,
  action: Pick<PendingAction, "id">,
  entity_id: string,
  resource_type: ResourceType,
  amount: number,
  note: string,
  payload: Record<string, string | number | boolean> = {}
): TickAccumulator => {
  if (amount <= 0) {
    return accumulator;
  }

  return appendLedgerEntry(accumulator, createResourceLedgerEntryInput({
    tick: tick_number,
    entity_id,
    resource_type,
    amount_delta: amount,
    action_ref: action.id,
    note,
    payload
  }));
};
