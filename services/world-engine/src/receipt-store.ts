import { readFile, writeFile } from "node:fs/promises";
import type { ProcessedTickReceipt } from "../../../packages/simulation/src";

const getReceiptStorePath = (input_path: string): string => `${input_path}.receipts.json`;

export const loadReceiptStore = async (input_path: string): Promise<Record<string, ProcessedTickReceipt>> => {
  try {
    const raw = await readFile(getReceiptStorePath(input_path), "utf-8");
    return JSON.parse(raw) as Record<string, ProcessedTickReceipt>;
  } catch {
    return {};
  }
};

export const saveReceiptStore = async (
  input_path: string,
  receipts: Record<string, ProcessedTickReceipt>
): Promise<void> => {
  await writeFile(getReceiptStorePath(input_path), `${JSON.stringify(receipts, null, 2)}\n`, "utf-8");
};
