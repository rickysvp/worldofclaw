import { readFile } from "node:fs/promises";
import { advanceWorldTick, type ProcessedTickReceipt } from "../../../packages/simulation/src";
import { validateWorldState, type WorldState } from "../../../packages/schemas/src";
import { loadReceiptStore, saveReceiptStore } from "./receipt-store";

const run = async () => {
  const input_path = process.argv[2] ?? "seed/world.seed.json";
  const range_length = Number(process.argv[3] ?? "1");
  const seed = process.argv[4];
  const raw = await readFile(input_path, "utf-8");
  const parsed_json = JSON.parse(raw) as unknown;
  const validation = validateWorldState(parsed_json);

  if (!validation.ok) {
    process.stdout.write(`${JSON.stringify(validation, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  let world_state: WorldState = validation.data;
  const processed_receipts: Record<string, ProcessedTickReceipt> = {
    ...(await loadReceiptStore(input_path))
  };
  const results = [];

  for (let index = 0; index < range_length; index += 1) {
    const result = advanceWorldTick(world_state, {
      seed: seed ?? world_state.meta.seed,
      processed_receipts
    });
    processed_receipts[result.idempotency_key] = result.receipt;
    world_state = result.next_state;
    results.push(result);
  }

  await saveReceiptStore(input_path, processed_receipts);

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
};

void run();
