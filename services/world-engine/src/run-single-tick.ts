import { readFile } from "node:fs/promises";
import { advanceWorldTick } from "../../../packages/simulation/src";
import { validateWorldState } from "../../../packages/schemas/src";
import { loadReceiptStore, saveReceiptStore } from "./receipt-store";

const run = async () => {
  const input_path = process.argv[2] ?? "seed/world.seed.json";
  const seed = process.argv[3];
  const raw = await readFile(input_path, "utf-8");
  const parsed_json = JSON.parse(raw) as unknown;
  const validation = validateWorldState(parsed_json);

  if (!validation.ok) {
    process.stdout.write(JSON.stringify(validation, null, 2));
    process.exitCode = 1;
    return;
  }

  const processed_receipts = await loadReceiptStore(input_path);
  const result = seed
    ? advanceWorldTick(validation.data, { seed, processed_receipts })
    : advanceWorldTick(validation.data, { processed_receipts });

  if (result.applied) {
    await saveReceiptStore(input_path, {
      ...processed_receipts,
      [result.idempotency_key]: result.receipt
    });
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

void run();
