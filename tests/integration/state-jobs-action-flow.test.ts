import { beforeEach, describe, expect, it } from "vitest";
import { handleClaimRoute } from "../../services/api/src/routes/claim";
import { handleEventAckRoute } from "../../services/api/src/routes/event-ack";
import { handleRegisterRoute } from "../../services/api/src/routes/register";
import { handleSubmitActionRoute } from "../../services/api/src/routes/submit-action";
import { handleWorldJobsRoute } from "../../services/api/src/routes/world-jobs";
import { handleWorldStateRoute } from "../../services/api/src/routes/world-state";
import { appendWorldEventForTests, resetSessionService, seedBridgeAgentForTests } from "../../services/api/src/services/session.service";

describe("state jobs action flow", () => {
  beforeEach(() => {
    resetSessionService();
    seedBridgeAgentForTests({ user_id: "user_state", agent_id: "agent_state" });
  });

  it("reads state, pulls jobs, submits action, and acknowledges events", () => {
    const register = handleRegisterRoute({
      body: {
        idempotency_key: "idem_register_state_flow",
        skill_name: "openclaw_world_skill",
        user_id: "user_state",
        agent_id: "agent_state",
        skill_version: "0.1.0",
        local_digest: "digest_state",
        requested_capabilities: {
          register: true,
          claim: true,
          heartbeat: true,
          state: true,
          jobs: true,
          action: true,
          event_ack: true
        }
      }
    });
    if (!register.body.ok) throw new Error("register failed");
    const registerData = register.body.data as { claim_token: string };

    const claim = handleClaimRoute({
      body: {
        idempotency_key: "idem_claim_state_flow",
        claim_token: registerData.claim_token,
        skill_name: "openclaw_world_skill",
        agent_id: "agent_state",
        local_digest: "digest_state"
      }
    });
    if (!claim.body.ok) throw new Error("claim failed");
    const claimData = claim.body.data as { world_access_token: string; session_id: string };

    const access = `Bearer ${claimData.world_access_token}`;
    const eventId = appendWorldEventForTests({ agent_id: "agent_state" });

    const state = handleWorldStateRoute({ headers: { authorization: access }, body: undefined });
    expect(state.status).toBe(200);
    if (!state.body.ok) throw new Error("state failed");
    const stateData = state.body.data as { agent: { id: string }; pending_event_ids: string[] };
    expect(stateData.agent.id).toBe("agent_state");
    expect(stateData.pending_event_ids).toContain(eventId);

    const jobs = handleWorldJobsRoute({ headers: { authorization: access }, body: undefined });
    expect(jobs.status).toBe(200);
    if (!jobs.body.ok) throw new Error("jobs failed");
    const jobsData = jobs.body.data as { jobs: unknown[] };
    expect(jobsData.jobs.length).toBeGreaterThan(0);

    const submit = handleSubmitActionRoute({
      headers: { authorization: access },
      body: {
        idempotency_key: "idem_submit_action_flow",
        agent_id: "agent_state",
        action_type: "move",
        tick_seen: 0,
        payload: { target_sector_id: "sector_0_1" }
      }
    });
    expect(submit.status).toBe(200);
    if (!submit.body.ok) throw new Error("submit failed");
    const submitData = submit.body.data as { accepted: boolean };
    expect(submitData.accepted).toBe(true);

    const ack = handleEventAckRoute({
      headers: { authorization: access },
      body: {
        idempotency_key: "idem_ack_state_flow",
        session_id: claimData.session_id,
        agent_id: "agent_state",
        event_ids: [eventId]
      }
    });

    expect(ack.status).toBe(200);
    if (!ack.body.ok) throw new Error("ack failed");
    const ackData = ack.body.data as { acked_event_ids: string[] };
    expect(ackData.acked_event_ids).toContain(eventId);
  });

  it("caps returned jobs to the documented max per pull", () => {
    const register = handleRegisterRoute({
      body: {
        idempotency_key: "idem_register_jobs_cap",
        skill_name: "openclaw_world_skill",
        user_id: "user_state",
        agent_id: "agent_state",
        skill_version: "0.1.0",
        local_digest: "digest_jobs_cap",
        requested_capabilities: {
          register: true,
          claim: true,
          heartbeat: true,
          state: true,
          jobs: true,
          action: true,
          event_ack: true
        }
      }
    });
    if (!register.body.ok) throw new Error("register failed");
    const registerData = register.body.data as { claim_token: string };

    const claim = handleClaimRoute({
      body: {
        idempotency_key: "idem_claim_jobs_cap",
        claim_token: registerData.claim_token,
        skill_name: "openclaw_world_skill",
        agent_id: "agent_state",
        local_digest: "digest_jobs_cap"
      }
    });
    if (!claim.body.ok) throw new Error("claim failed");
    const claimData = claim.body.data as { world_access_token: string };

    for (let index = 0; index < 25; index += 1) {
      appendWorldEventForTests({ agent_id: "agent_state", title: `event_${index}` });
    }

    const jobs = handleWorldJobsRoute({
      headers: { authorization: `Bearer ${claimData.world_access_token}` },
      body: undefined
    });

    expect(jobs.status).toBe(200);
    if (!jobs.body.ok) throw new Error("jobs failed");
    const jobsData = jobs.body.data as { jobs: Array<{ job_type: string }> };
    expect(jobsData.jobs).toHaveLength(20);
    expect(jobsData.jobs.every((job) => job.job_type === "event_ack")).toBe(true);
  });
});
