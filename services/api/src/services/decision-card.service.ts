import type { BridgeJob } from "../../../../packages/skill-bridge/src/protocol.types";

export const createDecisionCardJob = (input: {
  job_id: string;
  tick: number;
  summary: string;
  payload: Record<string, string | number | boolean | null>;
}): BridgeJob => ({
  job_id: input.job_id,
  job_type: "decision_card",
  tick: input.tick,
  summary: input.summary,
  payload: input.payload
});
