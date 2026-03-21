/**
 * World Engine Continuous Runner
 * 
 * Runs the world tick simulation continuously, polling for events
 * and persisting state changes. Designed to run as a long-lived process.
 * 
 * Usage:
 *   npx tsx src/run-continuous.ts
 * 
 * Environment:
 *   WORLD_SEED_PATH   - path to world.seed.json (default: ../../seed/world.seed.json)
 *   TICK_INTERVAL_MS  - interval between ticks in ms (default: 5000)
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { advanceWorldTick } from "../../../packages/simulation/src";
import { validateWorldState } from "../../../packages/schemas/src";
import { loadReceiptStore, saveReceiptStore } from "./receipt-store";

interface RunOptions {
  seedPath: string;
  tickIntervalMs: number;
  maxTicks?: number;
}

const DEFAULT_OPTIONS: RunOptions = {
  seedPath: process.env.WORLD_SEED_PATH ?? "../../seed/world.seed.json",
  tickIntervalMs: parseInt(process.env.TICK_INTERVAL_MS ?? "5000", 10),
  maxTicks: process.env.MAX_TICKS ? parseInt(process.env.MAX_TICKS, 10) : undefined,
};

function resolveSeedPath(relPath: string): string {
  if (relPath.startsWith("/") || relPath.match(/^[A-Za-z]:/)) {
    return relPath;
  }
  // Resolve relative to this script's directory
  return require("node:path").resolve(__dirname, relPath);
}

async function runSingleTick(
  seedPath: string,
  processedReceipts: Record<string, unknown>
): Promise<{ newState: unknown; idempotencyKey: string; events: unknown[] }> {
  const raw = await readFile(seedPath, "utf-8");
  const parsedJson = JSON.parse(raw) as unknown;
  const validation = validateWorldState(parsedJson);

  if (!validation.ok) {
    throw new Error(`Invalid world state: ${JSON.stringify(validation.error)}`);
  }

  const result = advanceWorldTick(validation.data, { processed_receipts: processedReceipts });

  return {
    newState: validation.data,
    idempotencyKey: result.idempotency_key ?? `tick-${Date.now()}`,
    events: result.events ?? []
  };
}

function logEvent(event: unknown): void {
  const e = event as Record<string, unknown>;
  const severity = (e.severity as string) ?? "info";
  const prefix = severity === "critical" || severity === "high" ? "⚠️" : severity === "medium" ? "⚡" : "→";
  const eventType = e.event_type ?? e.type ?? "unknown";
  const message = (e.message ?? e.event_type ?? "tick event") as string;
  const tick = (e.tick ?? e.world_tick ?? "?") as string;
  console.log(`[Tick ${tick}] ${prefix} ${eventType}: ${message}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(options: RunOptions): Promise<void> {
  const seedPath = resolveSeedPath(options.seedPath);

  if (!existsSync(seedPath)) {
    console.error(`❌ Seed file not found: ${seedPath}`);
    process.exit(1);
  }

  console.log(`🌍 World Engine Starting`);
  console.log(`   Seed:   ${seedPath}`);
  console.log(`   Tick interval: ${options.tickIntervalMs}ms`);
  if (options.maxTicks) {
    console.log(`   Max ticks: ${options.maxTicks}`);
  }
  console.log("");

  let processedReceipts = await loadReceiptStore(seedPath);
  let tickCount = 0;
  let running = true;

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n📤 Received ${signal}, shutting down gracefully...`);
    running = false;
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  while (running) {
    const startTime = Date.now();
    const meta = JSON.parse(await readFile(seedPath, "utf-8")).meta as { current_tick: number };
    const currentTick = meta.current_tick ?? tickCount;

    try {
      const { newState, idempotencyKey, events } = await runSingleTick(seedPath, processedReceipts);

      // Persist receipts
      processedReceipts = await saveReceiptStore(seedPath, {
        ...processedReceipts,
        [idempotencyKey]: { tick: currentTick + 1, applied: true, at: new Date().toISOString() }
      });

      // Log events
      if (events.length === 0) {
        console.log(`[Tick ${currentTick + 1}] ✓ No events (tick applied: ${idempotencyKey})`);
      } else {
        for (const event of events as unknown[]) {
          logEvent(event);
        }
      }

      tickCount++;
    } catch (err) {
      const error = err as Error;
      console.error(`[Tick ${currentTick + 1}] ❌ Error: ${error.message}`);
      // Continue running even on error
    }

    if (options.maxTicks && tickCount >= options.maxTicks) {
      console.log(`\n✅ Reached max ticks (${options.maxTicks}), stopping.`);
      break;
    }

    const elapsed = Date.now() - startTime;
    const waitTime = Math.max(0, options.tickIntervalMs - elapsed);
    await sleep(waitTime);
  }

  console.log(`\n✅ World Engine stopped after ${tickCount} ticks.`);
}

void run(DEFAULT_OPTIONS);
