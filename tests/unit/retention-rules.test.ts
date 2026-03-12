import { describe, expect, it } from "vitest";
import { applyRetentionRules, partitionArchivedLogs, type WorldLogEntry } from "../../packages/logger/src";

describe("retention rules", () => {
  it("retains recent logs and archives old logs", () => {
    const entries: WorldLogEntry[] = [
      {
        log_id: "recent",
        world_id: "world",
        tick: 100,
        timestamp: new Date().toISOString(),
        log_type: "tick_log",
        entity_refs: {},
        severity: "info",
        payload: {},
        correlation_id: "recent"
      },
      {
        log_id: "old",
        world_id: "world",
        tick: 1,
        timestamp: new Date().toISOString(),
        log_type: "tick_log",
        entity_refs: {},
        severity: "info",
        payload: {},
        correlation_id: "old"
      }
    ];

    expect(applyRetentionRules(entries, 110)).toHaveLength(2);
    expect(partitionArchivedLogs(entries, 5000).archived).toHaveLength(2);
  });
});
