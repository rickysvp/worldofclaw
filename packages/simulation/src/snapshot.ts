import { createHash } from "node:crypto";
import type { WorldState } from "../../schemas/src";
import type { PendingAction, ProcessedTickReceipt } from "./tick-context";

const stable_stringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stable_stringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stable_stringify(record[key])}`).join(",")}}`;
};

export const createChecksum = (input: unknown): string =>
  createHash("sha256").update(stable_stringify(input)).digest("hex");

export const createWorldChecksum = (world_state: WorldState): string => createChecksum(world_state);

export const createActionQueueChecksum = (action_queue: ReadonlyArray<PendingAction>): string =>
  createChecksum(action_queue);

export const createReceiptChecksum = (receipt: Omit<ProcessedTickReceipt, "receipt_checksum">): string =>
  createChecksum(receipt);
