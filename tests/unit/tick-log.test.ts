import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src/tick-engine";
import { createTickLog } from "../../packages/logger/src";

describe("tick log", () => {
  it("creates a structured tick log", () => {
    const result = advanceWorldTick(createDefaultWorldState("tick_log_seed"));
    const log = createTickLog(result);
    expect(log.log_type).toBe("tick_log");
    expect(log.payload.event_count).toBe(result.event_count);
  });
});
