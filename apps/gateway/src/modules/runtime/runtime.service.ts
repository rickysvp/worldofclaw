import { DEFAULT_HEARTBEAT_INTERVAL_SECONDS, WORLD_ID } from "../../../../../packages/shared/src/constants";
import { createCorrelationId } from "../../../../../packages/shared/src/ids";
import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { loadGatewayConfig } from "../../config/gateway-config";
import { generateRuntimeToken, hashIdempotencyRequest, hashRuntimeToken } from "../../lib/tokens";
import type {
  ResourceDelta,
  RuntimeActionResultInput,
  RuntimeCommandsPollQuery,
  RuntimeHeartbeatInput,
  RuntimeRegisterInput
} from "./runtime.schema";
import { RuntimeRepository } from "./runtime.repo";

type RuntimeRecord = NonNullable<Awaited<ReturnType<RuntimeRepository["findRuntimeByIdAndTokenHash"]>>>;

export class RuntimeService {
  constructor(private readonly repo: RuntimeRepository) {}

  async registerRuntime(input: RuntimeRegisterInput) {
    const user = await this.repo.createUserIfMissing(input.user_ref);
    if (!user) {
      throw new AppError("USER_CREATE_FAILED", 500);
    }

    const authToken = generateRuntimeToken();
    const authTokenHash = hashRuntimeToken(authToken, env.RUNTIME_TOKEN_SECRET);
    const correlationId = createCorrelationId();

    const runtime = await this.repo.createRuntime({
      userId: user.id,
      clawName: input.claw_name,
      runtimeName: input.runtime_name,
      authTokenHash,
      runtimeVersion: input.runtime_version,
      status: "registered"
    });

    if (!runtime) {
      throw new AppError("RUNTIME_CREATE_FAILED", 500);
    }

    const session = await this.repo.createRuntimeSession({
      runtimeId: runtime.id,
      worldId: WORLD_ID,
      currentSector: "safe_zone_0_0",
      sessionStatus: "active"
    });
    if (!session) {
      throw new AppError("RUNTIME_SESSION_CREATE_FAILED", 500);
    }

    const pendingLink = await this.repo.findPendingTelegramLink(user.id);
    const link = pendingLink ?? (await this.repo.createPendingTelegramLink(user.id, this.repo.createLinkCode()));
    if (!link) {
      throw new AppError("TELEGRAM_LINK_CREATE_FAILED", 500);
    }

    await this.repo.insertAuditLog({
      actorType: "system",
      actorRef: "runtime_service",
      action: "runtime_registered",
      targetType: "runtime",
      targetId: runtime.id,
      correlationId,
      payloadJson: {
        user_id: user.id,
        runtime_name: input.runtime_name,
        claw_name: input.claw_name,
        runtime_version: input.runtime_version,
        session_id: session.id,
        telegram_link_code: link.linkCode
      }
    });

    return {
      runtime_id: runtime.id,
      session_id: session.id,
      auth_token: authToken,
      telegram_link_code: link.linkCode,
      polling_endpoint: `${env.APP_BASE_URL}/api/runtime/commands/poll`,
      heartbeat_interval_seconds: DEFAULT_HEARTBEAT_INTERVAL_SECONDS
    };
  }

  async heartbeat(input: RuntimeHeartbeatInput, authTokenHash: string) {
    const { runtime, session } = await this.assertAuthorizedRuntime(input.runtime_id, input.session_id, authTokenHash);
    const now = new Date();
    const staleThresholdMs = env.HEARTBEAT_STALE_AFTER_SECONDS * 1000;
    const wasStale =
      runtime.lastSeenAt instanceof Date && now.getTime() - runtime.lastSeenAt.getTime() > staleThresholdMs;

    await this.repo.insertHeartbeat({
      runtimeId: input.runtime_id,
      sessionId: input.session_id,
      power: input.power,
      durability: input.durability,
      credits: input.credits,
      currentAction: input.current_action,
      currentSector: input.current_sector,
      summaryJson: {
        ...input.summary,
        current_tick: input.current_tick ?? session.currentTick
      }
    });

    await this.repo.updateRuntimeState({
      runtimeId: input.runtime_id,
      status: "active",
      lastSeenAt: now
    });

    const sessionUpdate: {
      sessionId: string;
      currentSector: string;
      currentTick?: number;
    } = {
      sessionId: input.session_id,
      currentSector: input.current_sector
    };
    if (input.current_tick !== undefined) {
      sessionUpdate.currentTick = input.current_tick;
    }

    await this.repo.updateSessionState(sessionUpdate);

    const pendingCommandCount = await this.repo.countPendingCommands(input.runtime_id);

    await this.repo.insertAuditLog({
      actorType: "runtime",
      actorRef: input.runtime_id,
      action: wasStale ? "runtime_heartbeat_recovered" : "runtime_heartbeat",
      targetType: "runtime_session",
      targetId: input.session_id,
      correlationId: null,
      payloadJson: {
        power: input.power,
        durability: input.durability,
        credits: input.credits,
        current_action: input.current_action,
        current_sector: input.current_sector,
        current_tick: input.current_tick ?? session.currentTick,
        pending_command_count: pendingCommandCount
      }
    });

    return {
      accepted: true,
      next_poll_after: DEFAULT_HEARTBEAT_INTERVAL_SECONDS,
      pending_command_count: pendingCommandCount
    };
  }

  async pollCommands(input: RuntimeCommandsPollQuery, authTokenHash: string) {
    await this.assertAuthorizedRuntime(input.runtime_id, input.session_id, authTokenHash);
    const commands = await this.repo.getQueuedCommands(input.runtime_id);

    if (input.mark_delivered) {
      await this.repo.markCommandsDelivered(commands.map((command) => command.id));
    }

    await this.repo.insertAuditLog({
      actorType: "runtime",
      actorRef: input.runtime_id,
      action: input.mark_delivered ? "runtime_commands_polled_and_delivered" : "runtime_commands_polled",
      targetType: "runtime_session",
      targetId: input.session_id,
      correlationId: null,
      payloadJson: {
        command_count: commands.length,
        mark_delivered: input.mark_delivered
      }
    });

    return {
      commands: commands.map((command) => ({
        command_id: command.id,
        command_type: command.commandType,
        payload: command.payloadJson,
        decision_id: command.decisionId,
        created_at: command.createdAt.toISOString()
      }))
    };
  }

  async recordActionResult(input: RuntimeActionResultInput, authTokenHash: string) {
    const { runtime } = await this.assertAuthorizedRuntime(input.runtime_id, input.session_id, authTokenHash);
    const scope = "runtime:action-result";
    const existingKey = await this.repo.findIdempotencyKey(scope, input.correlation_id);

    if (!existingKey) {
      await this.repo.createIdempotencyKey({
        scope,
        idemKey: input.correlation_id,
        requestHash: hashIdempotencyRequest(input),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    } else {
      return {
        accepted: true,
        idempotent: true
      };
    }

    await this.repo.createRuntimeEvent({
      runtimeId: input.runtime_id,
      sessionId: input.session_id,
      eventType: `${input.action_type}.result`,
      severity: input.result.status === "failed" ? "high" : "low",
      correlationId: input.correlation_id,
      payloadJson: {
        result: input.result,
        rewards: input.rewards,
        losses: input.losses,
        next_state_summary: input.next_state_summary,
        world_tick: input.world_tick
      }
    });

    const config = loadGatewayConfig();
    const ledgerEntries = [
      ...this.createLedgerEntries({
        runtimeId: runtime.id,
        sessionId: input.session_id,
        decisionId: null,
        actionType: input.action_type,
        correlationId: input.correlation_id,
        worldTick: input.world_tick,
        deltas: input.rewards,
        domain: config.ledgerDomains.has("action_reward") ? "action_reward" : "action_reward",
        entryType: "credit"
      }),
      ...this.createLedgerEntries({
        runtimeId: runtime.id,
        sessionId: input.session_id,
        decisionId: null,
        actionType: input.action_type,
        correlationId: input.correlation_id,
        worldTick: input.world_tick,
        deltas: input.losses,
        domain: config.ledgerDomains.has("action_cost") ? "action_cost" : "action_cost",
        entryType: "debit"
      })
    ];

    const command = await this.repo.findCommandByCorrelation(input.runtime_id, input.correlation_id);
    if (command?.decisionId) {
      for (const entry of ledgerEntries) {
        entry.decisionId = command.decisionId;
      }
    }

    await this.repo.createLedgerEntries(ledgerEntries);

    if (command) {
      await this.repo.markCommandAcknowledged(command.id);
      if (command.decisionId) {
        await this.repo.markDecisionResolved(command.decisionId);
      }
    }

    await this.repo.insertAuditLog({
      actorType: "runtime",
      actorRef: input.runtime_id,
      action: "runtime_action_result_recorded",
      targetType: "runtime_event",
      targetId: input.correlation_id,
      correlationId: input.correlation_id,
      payloadJson: {
        action_type: input.action_type,
        result: input.result,
        rewards_count: input.rewards.length,
        losses_count: input.losses.length,
        linked_command_id: command?.id ?? null,
        linked_decision_id: command?.decisionId ?? null
      }
    });

    return {
      accepted: true,
      idempotent: false
    };
  }

  private async assertAuthorizedRuntime(runtimeId: string, sessionId: string, authTokenHash: string) {
    const runtime = await this.repo.findRuntimeByIdAndTokenHash(runtimeId, authTokenHash);
    if (!runtime) {
      throw new AppError("RUNTIME_AUTH_INVALID", 401);
    }

    const session = await this.repo.findSession(sessionId, runtimeId);
    if (!session) {
      throw new AppError("SESSION_NOT_FOUND", 404);
    }

    return {
      runtime: runtime as RuntimeRecord,
      session
    };
  }

  private createLedgerEntries(input: {
    runtimeId: string;
    sessionId: string;
    decisionId: string | null;
    actionType: string;
    correlationId: string;
    worldTick: number;
    deltas: ResourceDelta[];
    domain: string;
    entryType: string;
  }) {
    return input.deltas.map((delta) => ({
      domain: input.domain,
      entryType: input.entryType,
      ownerType: "runtime",
      ownerId: input.runtimeId,
      counterpartyType: null,
      counterpartyId: null,
      resourceType: delta.resource_type,
      quantity: delta.quantity,
      unit: delta.unit,
      sourceType: "event",
      sourceId: input.correlationId,
      causedByAction: input.actionType,
      causedByEvent: `${input.actionType}.result`,
      decisionId: input.decisionId,
      sessionId: input.sessionId,
      worldTick: input.worldTick,
      status: "finalized" as const,
      metadataJson: {
        correlation_id: input.correlationId
      },
      finalizedAt: new Date()
    }));
  }
}
