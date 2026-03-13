import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../apps/gateway/src/lib/errors";
import { DecisionService } from "../../apps/gateway/src/modules/decision/decision.service";
import { RuntimeService } from "../../apps/gateway/src/modules/runtime/runtime.service";
import { TelegramService } from "../../apps/gateway/src/modules/telegram/telegram.service";

const createSender = () => ({
  sendRawMessage: vi.fn().mockResolvedValue(undefined),
  sendLinkedSuccess: vi.fn().mockResolvedValue(undefined),
  sendStatusSummary: vi.fn().mockResolvedValue(undefined),
  sendDecisionRequest: vi.fn().mockResolvedValue(undefined),
  sendDecisionResolved: vi.fn().mockResolvedValue(undefined),
  sendTimeoutNotice: vi.fn().mockResolvedValue(undefined),
  sendRuntimeStaleNotice: vi.fn().mockResolvedValue(undefined)
});

const decisionFixture = (status: "pending" | "waiting_user_response" | "approved" | "rejected" | "modified" | "expired" | "resolved" = "pending") => ({
  id: "11111111-1111-1111-1111-111111111111",
  runtimeId: "22222222-2222-2222-2222-222222222222",
  sessionId: "33333333-3333-3333-3333-333333333333",
  decisionType: "high_value_trade",
  title: "Trade approval",
  reason: "Risky trade",
  riskLevel: "high" as const,
  status,
  recommendedOption: "reject",
  optionsJson: [{ id: "approve" }, { id: "reject" }],
  snapshotJson: {
    world_tick: 100,
    trade: {
      counterparty: "night_wharf_market",
      estimated_spend: 520
    }
  },
  expiresAt: new Date(Date.now() + 1_000),
  correlationId: "corr-1",
  resolvedAt: status === "pending" || status === "waiting_user_response" ? null : new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

describe("stage 3 gateway loop", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("heartbeat success writes heartbeat and updates runtime", async () => {
    const repo = {
      createUserIfMissing: vi.fn(),
      createRuntime: vi.fn(),
      createRuntimeSession: vi.fn(),
      findPendingTelegramLink: vi.fn(),
      createPendingTelegramLink: vi.fn(),
      createLinkCode: vi.fn(),
      insertAuditLog: vi.fn().mockResolvedValue(undefined),
      findRuntimeByIdAndTokenHash: vi.fn().mockResolvedValue({
        id: "runtime-1",
        lastSeenAt: new Date(Date.now() - 200_000)
      }),
      findSession: vi.fn().mockResolvedValue({
        id: "session-1",
        currentTick: 17
      }),
      insertHeartbeat: vi.fn().mockResolvedValue(undefined),
      updateRuntimeState: vi.fn().mockResolvedValue(undefined),
      updateSessionState: vi.fn().mockResolvedValue(undefined),
      countPendingCommands: vi.fn().mockResolvedValue(2)
    };

    const service = new RuntimeService(repo as never);
    const result = await service.heartbeat(
      {
        runtime_id: "22222222-2222-2222-2222-222222222222",
        session_id: "33333333-3333-3333-3333-333333333333",
        power: 91,
        durability: 88,
        credits: 640,
        current_action: "scan",
        current_sector: "night_wharf",
        summary: { note: "steady" },
        current_tick: 42
      },
      "hash"
    );

    expect(result.accepted).toBe(true);
    expect(result.pending_command_count).toBe(2);
    expect(repo.insertHeartbeat).toHaveBeenCalledTimes(1);
    expect(repo.updateRuntimeState).toHaveBeenCalledWith(
      expect.objectContaining({ runtimeId: "22222222-2222-2222-2222-222222222222", status: "active" })
    );
    expect(repo.updateSessionState).toHaveBeenCalledWith(
      expect.objectContaining({ currentSector: "night_wharf", currentTick: 42 })
    );
  });

  it("decision approve generates command_outbox", async () => {
    const repo = {
      findDecisionByIdForUser: vi.fn().mockResolvedValue(decisionFixture("pending")),
      findDecisionById: vi.fn(),
      findIdempotencyKey: vi.fn().mockResolvedValue(null),
      createIdempotencyRecord: vi.fn().mockResolvedValue(undefined),
      updateDecision: vi.fn().mockResolvedValue(undefined),
      createDecisionAction: vi.fn().mockResolvedValue(undefined),
      createCommand: vi.fn().mockResolvedValue({ id: "cmd-approve" }),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
      findActiveTelegramLinkByRuntime: vi.fn().mockResolvedValue(null),
      createLedgerEntries: vi.fn().mockResolvedValue(undefined),
      findRuntime: vi.fn().mockResolvedValue({ clawName: "Ash Claw" }),
      findLatestCommandForDecision: vi.fn().mockResolvedValue(null)
    };
    const sender = createSender();
    const service = new DecisionService(repo as never, sender);

    const result = await service.approveDecision(decisionFixture().id, {
      actorType: "telegram",
      actorRef: "chat:1",
      userId: "user-1"
    });

    expect(result.command_id).toBe("cmd-approve");
    expect(result.status).toBe("approved");
    expect(repo.createCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        commandType: "approval_resolved",
        payloadJson: expect.objectContaining({ resolution: "approve" })
      })
    );
  });

  it("decision reject generates command_outbox", async () => {
    const repo = {
      findDecisionByIdForUser: vi.fn().mockResolvedValue(decisionFixture("pending")),
      findDecisionById: vi.fn(),
      findIdempotencyKey: vi.fn().mockResolvedValue(null),
      createIdempotencyRecord: vi.fn().mockResolvedValue(undefined),
      updateDecision: vi.fn().mockResolvedValue(undefined),
      createDecisionAction: vi.fn().mockResolvedValue(undefined),
      createCommand: vi.fn().mockResolvedValue({ id: "cmd-reject" }),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
      findActiveTelegramLinkByRuntime: vi.fn().mockResolvedValue(null),
      createLedgerEntries: vi.fn().mockResolvedValue(undefined),
      findRuntime: vi.fn().mockResolvedValue({ clawName: "Ash Claw" }),
      findLatestCommandForDecision: vi.fn().mockResolvedValue(null)
    };
    const service = new DecisionService(repo as never, createSender());

    const result = await service.rejectDecision(decisionFixture().id, {
      actorType: "telegram",
      actorRef: "chat:1",
      userId: "user-1"
    });

    expect(result.command_id).toBe("cmd-reject");
    expect(repo.createCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        payloadJson: expect.objectContaining({ resolution: "reject" })
      })
    );
  });

  it("decision modify only allows quantity budget_cap and route_risk", async () => {
    const baseRepo = {
      findDecisionByIdForUser: vi.fn().mockResolvedValue(decisionFixture("pending")),
      findDecisionById: vi.fn(),
      findIdempotencyKey: vi.fn().mockResolvedValue(null),
      createIdempotencyRecord: vi.fn().mockResolvedValue(undefined),
      updateDecision: vi.fn().mockResolvedValue(undefined),
      createDecisionAction: vi.fn().mockResolvedValue(undefined),
      createCommand: vi.fn().mockResolvedValue({ id: "cmd-modify" }),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
      findActiveTelegramLinkByRuntime: vi.fn().mockResolvedValue(null),
      createLedgerEntries: vi.fn().mockResolvedValue(undefined),
      findRuntime: vi.fn().mockResolvedValue({ clawName: "Ash Claw" }),
      findLatestCommandForDecision: vi.fn().mockResolvedValue(null)
    };
    const service = new DecisionService(baseRepo as never, createSender());

    const quantityResult = await service.modifyDecision(decisionFixture().id, "quantity", "6", {
      actorType: "telegram",
      actorRef: "chat:1",
      userId: "user-1"
    });
    expect(quantityResult.status).toBe("modified");

    await expect(
      service.modifyDecision(decisionFixture().id, "route_risk", "forbidden", {
        actorType: "telegram",
        actorRef: "chat:1",
        userId: "user-1"
      })
    ).rejects.toMatchObject({ code: "COMMAND_PATCH_INVALID" });
  });

  it("telegram user cannot operate another user's decision", async () => {
    const telegramRepo = {
      findIdempotencyKey: vi.fn().mockResolvedValue(null),
      createIdempotencyKey: vi.fn().mockResolvedValue(undefined),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
      listStaleActiveLinks: vi.fn().mockResolvedValue([]),
      markRuntimeStale: vi.fn().mockResolvedValue(undefined),
      findLinkByCode: vi.fn(),
      activateLink: vi.fn(),
      findClawNameByUser: vi.fn(),
      findActiveLinkByChatId: vi.fn().mockResolvedValue({
        userId: "user-allowed"
      }),
      getStatusSummaryByUser: vi.fn()
    };
    const decisionService = {
      approveDecision: vi.fn().mockRejectedValue(new AppError("DECISION_NOT_FOUND_OR_FORBIDDEN", 404)),
      rejectDecision: vi.fn(),
      modifyDecision: vi.fn()
    };
    const sender = createSender();
    const service = new TelegramService(telegramRepo as never, decisionService as never, sender);

    await expect(
      service.handleUpdate({
        update_id: 1,
        message: {
          message_id: 1,
          text: `/approve ${decisionFixture().id}`,
          chat: { id: "chat-1" },
          from: { id: "from-1" }
        }
      })
    ).rejects.toMatchObject({ code: "DECISION_NOT_FOUND_OR_FORBIDDEN" });
    expect(sender.sendRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: "DECISION_NOT_FOUND_OR_FORBIDDEN" })
    );
  });

  it("duplicate approve does not generate duplicate command", async () => {
    const repo = {
      findDecisionByIdForUser: vi.fn().mockResolvedValue(decisionFixture("approved")),
      findDecisionById: vi.fn(),
      findIdempotencyKey: vi.fn().mockResolvedValue(null),
      createIdempotencyRecord: vi.fn().mockResolvedValue(undefined),
      updateDecision: vi.fn().mockResolvedValue(undefined),
      createDecisionAction: vi.fn().mockResolvedValue(undefined),
      createCommand: vi.fn(),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
      findActiveTelegramLinkByRuntime: vi.fn().mockResolvedValue(null),
      createLedgerEntries: vi.fn().mockResolvedValue(undefined),
      findRuntime: vi.fn().mockResolvedValue({ clawName: "Ash Claw" }),
      findLatestCommandForDecision: vi.fn().mockResolvedValue({ id: "cmd-existing" })
    };
    const service = new DecisionService(repo as never, createSender());

    const result = await service.approveDecision(decisionFixture("approved").id, {
      actorType: "telegram",
      actorRef: "chat:1",
      userId: "user-1"
    });

    expect(result.idempotent).toBe(true);
    expect(result.command_id).toBe("cmd-existing");
    expect(repo.createCommand).not.toHaveBeenCalled();
  });

  it("poll commands returns queued commands", async () => {
    const repo = {
      findRuntimeByIdAndTokenHash: vi.fn().mockResolvedValue({ id: "runtime-1" }),
      findSession: vi.fn().mockResolvedValue({ id: "session-1", currentTick: 1 }),
      getQueuedCommands: vi.fn().mockResolvedValue([
        {
          id: "cmd-1",
          commandType: "approval_resolved",
          payloadJson: { resolution: "approve" },
          decisionId: decisionFixture().id,
          createdAt: new Date("2026-03-13T00:00:00Z")
        }
      ]),
      markCommandsDelivered: vi.fn().mockResolvedValue(undefined),
      insertAuditLog: vi.fn().mockResolvedValue(undefined)
    };
    const service = new RuntimeService(repo as never);
    const result = await service.pollCommands(
      {
        runtime_id: decisionFixture().runtimeId,
        session_id: decisionFixture().sessionId,
        mark_delivered: false
      },
      "hash"
    );

    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]?.command_id).toBe("cmd-1");
    expect(repo.markCommandsDelivered).not.toHaveBeenCalled();
  });

  it("mark_delivered=true updates delivered status", async () => {
    const repo = {
      findRuntimeByIdAndTokenHash: vi.fn().mockResolvedValue({ id: "runtime-1" }),
      findSession: vi.fn().mockResolvedValue({ id: "session-1", currentTick: 1 }),
      getQueuedCommands: vi.fn().mockResolvedValue([
        {
          id: "cmd-1",
          commandType: "approval_resolved",
          payloadJson: { resolution: "approve" },
          decisionId: decisionFixture().id,
          createdAt: new Date("2026-03-13T00:00:00Z")
        }
      ]),
      markCommandsDelivered: vi.fn().mockResolvedValue([{ id: "cmd-1" }]),
      insertAuditLog: vi.fn().mockResolvedValue(undefined)
    };
    const service = new RuntimeService(repo as never);

    await service.pollCommands(
      {
        runtime_id: decisionFixture().runtimeId,
        session_id: decisionFixture().sessionId,
        mark_delivered: true
      },
      "hash"
    );

    expect(repo.markCommandsDelivered).toHaveBeenCalledWith(["cmd-1"]);
  });

  it("action-result idempotency protection is enforced", async () => {
    const repo = {
      findRuntimeByIdAndTokenHash: vi.fn().mockResolvedValue({ id: "runtime-1" }),
      findSession: vi.fn().mockResolvedValue({ id: "session-1", currentTick: 1 }),
      findIdempotencyKey: vi.fn().mockResolvedValue({ id: "idem-1" }),
      createIdempotencyKey: vi.fn().mockResolvedValue(undefined),
      createRuntimeEvent: vi.fn().mockResolvedValue(undefined),
      createLedgerEntries: vi.fn().mockResolvedValue(undefined),
      findCommandByCorrelation: vi.fn().mockResolvedValue(null),
      markCommandAcknowledged: vi.fn().mockResolvedValue(undefined),
      markDecisionResolved: vi.fn().mockResolvedValue(undefined),
      insertAuditLog: vi.fn().mockResolvedValue(undefined)
    };
    const service = new RuntimeService(repo as never);

    const result = await service.recordActionResult(
      {
        runtime_id: decisionFixture().runtimeId,
        session_id: decisionFixture().sessionId,
        action_type: "approval_resume",
        correlation_id: "corr-runtime-1",
        result: {
          status: "success",
          summary: "already processed"
        },
        rewards: [],
        losses: [],
        next_state_summary: {},
        world_tick: 5
      },
      "hash"
    );

    expect(result.idempotent).toBe(true);
    expect(repo.createRuntimeEvent).not.toHaveBeenCalled();
  });

  it("timeout job marks expired decisions", async () => {
    const repo = {
      listExpiredOpenDecisions: vi.fn().mockResolvedValue([decisionFixture("waiting_user_response")]),
      findDecisionById: vi.fn().mockResolvedValue(decisionFixture("waiting_user_response")),
      updateDecision: vi.fn().mockResolvedValue(undefined),
      createDecisionAction: vi.fn().mockResolvedValue(undefined),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
      findActiveTelegramLinkByRuntime: vi.fn().mockResolvedValue(null),
      createCommand: vi.fn().mockResolvedValue({ id: "cmd-timeout" }),
      findRuntime: vi.fn().mockResolvedValue({ clawName: "Ash Claw" })
    };
    const service = new DecisionService(repo as never, createSender());

    const results = await service.expirePendingDecisions(10);

    expect(results).toHaveLength(1);
    expect(repo.updateDecision).toHaveBeenCalledWith(
      expect.objectContaining({ decisionId: decisionFixture().id, status: "expired" })
    );
    expect(repo.createCommand).toHaveBeenCalledWith(
      expect.objectContaining({ commandType: "decision_timeout_fallback" })
    );
  });
});

describe("mock runtime demo-flow", () => {
  let tempDir = "";

  afterEach(async () => {
    vi.restoreAllMocks();
    delete process.env.MOCK_RUNTIME_STATE_FILE;
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("can complete one manual demo flow with mocked gateway responses", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "mock-runtime-stage3-"));
    process.env.MOCK_RUNTIME_STATE_FILE = join(tempDir, "state.json");

    const responses = [
      {
        runtime_id: decisionFixture().runtimeId,
        session_id: decisionFixture().sessionId,
        auth_token: "runtime-token",
        telegram_link_code: "claw-1234",
        heartbeat_interval_seconds: 30
      },
      { accepted: true, next_poll_after: 30, pending_command_count: 0 },
      { decision_id: decisionFixture().id, status: "pending" },
      { commands: [] },
      {
        commands: [
          {
            command_id: "cmd-1",
            command_type: "approval_resolved",
            payload: { correlation_id: "corr-demo-1", resolution: "approve" },
            decision_id: decisionFixture().id,
            created_at: new Date().toISOString()
          }
        ]
      },
      { accepted: true }
    ];

    const fetchMock = vi.fn(async () => {
      const next = responses.shift();
      return new Response(JSON.stringify(next), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(globalThis, "setTimeout").mockImplementation(((handler: TimerHandler) => {
      if (typeof handler === "function") {
        handler();
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    const runtimeModule = await import("../../apps/mock-runtime/src/index.ts");
    await runtimeModule.demoFlow();

    const savedStateRaw = await readFile(process.env.MOCK_RUNTIME_STATE_FILE, "utf8");
    const savedState = JSON.parse(savedStateRaw) as { last_command?: { command_id: string; correlation_id?: string } };

    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(savedState.last_command?.command_id).toBe("cmd-1");
    expect(savedState.last_command?.correlation_id).toBe("corr-demo-1");
  });
});
