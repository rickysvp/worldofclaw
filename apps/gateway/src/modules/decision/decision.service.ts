import { randomUUID } from "node:crypto";
import { getDecisionRule, loadGatewayConfig } from "../../config/gateway-config";
import { AppError } from "../../lib/errors";
import { hashIdempotencyRequest } from "../../lib/tokens";
import type { TelegramSender } from "../telegram/telegram.sender";
import type { DecisionModifyField, DecisionNeededInput } from "./decision.schema";
import { DecisionRepository } from "./decision.repo";

type DecisionRecord = {
  id: string;
  runtimeId: string;
  sessionId: string;
  decisionType: string;
  title: string;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  status: "pending" | "waiting_user_response" | "approved" | "rejected" | "modified" | "expired" | "resolved";
  recommendedOption: string;
  optionsJson: Record<string, unknown>[];
  snapshotJson: Record<string, unknown>;
  expiresAt: Date;
  correlationId: string;
  resolvedAt: Date | null;
};

type DecisionResolutionActor = {
  actorType: "user" | "telegram";
  actorRef: string;
  idempotencyKey?: string;
  correlationId?: string;
  userId?: string;
};

export class DecisionService {
  constructor(
    private readonly repo: DecisionRepository,
    private readonly telegramSender: TelegramSender
  ) {}

  async createDecision(input: DecisionNeededInput) {
    const existing = await this.repo.findDecisionByCorrelationId(input.correlation_id);
    if (existing) {
      return {
        decision_id: existing.id,
        status: existing.status
      };
    }

    const runtime = await this.repo.findRuntime(input.runtime_id);
    if (!runtime) {
      throw new AppError("RUNTIME_NOT_FOUND", 404);
    }

    const session = await this.repo.findSession(input.session_id, input.runtime_id);
    if (!session) {
      throw new AppError("SESSION_NOT_FOUND", 404);
    }

    const rule = getDecisionRule(input.decision_type);
    const expiresAt = new Date(input.expires_at);

    await this.repo.createIdempotencyRecord({
      idemKey: input.correlation_id,
      scope: "decision:create",
      requestHash: hashIdempotencyRequest(input),
      expiresAt
    });

    const decision = await this.repo.createDecision({
      runtimeId: input.runtime_id,
      sessionId: input.session_id,
      decisionType: input.decision_type,
      title: input.title,
      reason: input.reason,
      riskLevel: input.risk_level,
      recommendedOption: input.recommended_option,
      optionsJson: input.options,
      snapshotJson: input.snapshot,
      expiresAt,
      correlationId: input.correlation_id,
      status: "pending"
    });
    if (!decision) {
      throw new AppError("DECISION_CREATE_FAILED", 500);
    }
    const normalizedDecision = this.normalizeDecision(decision);

    await this.repo.createDecisionAction({
      decisionId: normalizedDecision.id,
      actorType: "system",
      actorRef: "decision_service",
      actionType: "system_created",
      payloadJson: {
        runtime_id: input.runtime_id,
        session_id: input.session_id,
        decision_type: input.decision_type
      }
    });

    await this.maybeWriteTradeReserve(normalizedDecision);

    await this.repo.createAuditLog({
      actorType: "system",
      actorRef: "decision_service",
      action: "decision_created",
      targetType: "decision",
      targetId: normalizedDecision.id,
      correlationId: input.correlation_id,
      payloadJson: {
        runtime_id: runtime.id,
        session_id: session.id,
        decision_type: input.decision_type,
        risk_level: input.risk_level,
        timeout_behavior: rule?.timeout_behavior ?? null
      }
    });

    await this.maybeSendDecisionNotification(normalizedDecision, rule?.timeout_behavior ?? "hold_position");

    return {
      decision_id: normalizedDecision.id,
      status: (await this.repo.findDecisionById(normalizedDecision.id))?.status ?? normalizedDecision.status
    };
  }

  async approveDecision(decisionId: string, actor: DecisionResolutionActor) {
    const decision = await this.getAuthorizedDecision(decisionId, actor.userId);
    return this.resolveDecision({
      decision,
      actor,
      nextStatus: "approved",
      actionType: "approved",
      resolution: "approve",
      payloadJson: {
        approved_option: decision.recommendedOption
      }
    });
  }

  async rejectDecision(decisionId: string, actor: DecisionResolutionActor) {
    const decision = await this.getAuthorizedDecision(decisionId, actor.userId);
    return this.resolveDecision({
      decision,
      actor,
      nextStatus: "rejected",
      actionType: "rejected",
      resolution: "reject",
      payloadJson: {}
    });
  }

  async modifyDecision(
    decisionId: string,
    field: DecisionModifyField,
    rawValue: string,
    actor: DecisionResolutionActor
  ) {
    const decision = await this.getAuthorizedDecision(decisionId, actor.userId);
    const decisionSnapshot = this.asRecord(decision.snapshotJson) ?? {};
    const modifiedValue = this.validateModification(field, rawValue);
    const updatedSnapshot = {
      ...decisionSnapshot,
      user_modifications: {
        ...(this.asRecord(decisionSnapshot.user_modifications) ?? {}),
        [field]: modifiedValue
      }
    };

    return this.resolveDecision({
      decision,
      actor,
      nextStatus: "modified",
      actionType: "modified",
      resolution: "modify",
      payloadJson: {
        modified_fields: {
          [field]: modifiedValue
        }
      },
      snapshotJson: updatedSnapshot
    });
  }

  async expireDecision(decisionId: string, reason: string) {
    const decision = await this.repo.findDecisionById(decisionId);
    if (!decision || !["pending", "waiting_user_response"].includes(decision.status)) {
      return null;
    }

    const rule = getDecisionRule(decision.decisionType);
    const timeoutBehavior = rule?.timeout_behavior ?? "hold_position";

    await this.repo.updateDecision({
      decisionId,
      status: "expired",
      resolvedAt: new Date()
    });

    await this.repo.createDecisionAction({
      decisionId,
      actorType: "system",
      actorRef: "decision_timeout_job",
      actionType: "expired",
      payloadJson: {
        timeout_behavior: timeoutBehavior,
        reason
      }
    });

    await this.repo.createAuditLog({
      actorType: "system",
      actorRef: "decision_timeout_job",
      action: "decision_expired",
      targetType: "decision",
      targetId: decisionId,
      correlationId: decision.correlationId,
      payloadJson: {
        timeout_behavior: timeoutBehavior
      }
    });

    const activeLink = await this.repo.findActiveTelegramLinkByRuntime(decision.runtimeId);
    if (activeLink) {
      await this.telegramSender.sendTimeoutNotice({
        chatId: activeLink.telegramChatId,
        decisionId,
        clawName: await this.getClawName(decision.runtimeId),
        timeoutBehavior
      });
    }

    await this.repo.createCommand({
      runtimeId: decision.runtimeId,
      decisionId,
      commandType: "decision_timeout_fallback",
      payloadJson: {
        decision_id: decisionId,
        correlation_id: `${decision.correlationId}:timeout`,
        resolution: "expired",
        timeout_behavior: timeoutBehavior
      }
    });

    return {
      decision_id: decisionId,
      status: "expired" as const
    };
  }

  async expirePendingDecisions(limit: number) {
    const decisions = await this.repo.listExpiredOpenDecisions(limit, new Date());
    const results = [];

    for (const decision of decisions) {
      const result = await this.expireDecision(decision.id, "decision expired before user response");
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  private async maybeSendDecisionNotification(decision: DecisionRecord, timeoutBehavior: string) {
    const config = loadGatewayConfig();
    if (!config.hasTelegramPrimary) {
      return;
    }

    const activeLink = await this.repo.findActiveTelegramLinkByRuntime(decision.runtimeId);
    if (!activeLink) {
      await this.repo.createAuditLog({
        actorType: "system",
        actorRef: "decision_service",
        action: "decision_notification_skipped_unlinked",
        targetType: "decision",
        targetId: decision.id,
        correlationId: decision.correlationId,
        payloadJson: {
          runtime_id: decision.runtimeId
        }
      });
      return;
    }

    const clawName = await this.getClawName(decision.runtimeId);
    await this.telegramSender.sendDecisionRequest({
      chatId: activeLink.telegramChatId,
      decisionId: decision.id,
      decisionType: decision.decisionType,
      title: decision.title,
      clawName,
      reason: decision.reason,
      riskLevel: decision.riskLevel,
      recommendedOption: decision.recommendedOption,
      expiresAt: decision.expiresAt.toISOString(),
      timeoutBehavior
    });

    await this.repo.updateDecision({
      decisionId: decision.id,
      status: "waiting_user_response"
    });

    await this.repo.createDecisionAction({
      decisionId: decision.id,
      actorType: "system",
      actorRef: "telegram_sender",
      actionType: "telegram_sent",
      payloadJson: {
        telegram_chat_id: activeLink.telegramChatId
      }
    });
  }

  private async resolveDecision(input: {
    decision: DecisionRecord;
    actor: DecisionResolutionActor;
    nextStatus: "approved" | "rejected" | "modified";
    actionType: "approved" | "rejected" | "modified";
    resolution: "approve" | "reject" | "modify";
    payloadJson: Record<string, unknown>;
    snapshotJson?: Record<string, unknown>;
  }) {
    const scope = `decision:${input.resolution}`;
    if (input.actor.idempotencyKey) {
      const existingKey = await this.repo.findIdempotencyKey(scope, input.actor.idempotencyKey);
      if (existingKey) {
        const existingCommand = await this.repo.findLatestCommandForDecision(input.decision.id);
        return {
          decision_id: input.decision.id,
          status: input.decision.status,
          command_id: existingCommand?.id ?? null,
          idempotent: true
        };
      }
    }

    if (!["pending", "waiting_user_response"].includes(input.decision.status)) {
      const existingCommand = await this.repo.findLatestCommandForDecision(input.decision.id);
      if (input.decision.status === input.nextStatus && existingCommand) {
        return {
          decision_id: input.decision.id,
          status: input.decision.status,
          command_id: existingCommand.id,
          idempotent: true
        };
      }

      throw new AppError("DECISION_ALREADY_FINALIZED", 409);
    }

    if (input.actor.idempotencyKey) {
      await this.repo.createIdempotencyRecord({
        idemKey: input.actor.idempotencyKey,
        scope,
        requestHash: hashIdempotencyRequest({
          decision_id: input.decision.id,
          resolution: input.resolution,
          payload: input.payloadJson
        }),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    const correlationId = input.actor.correlationId ?? `${input.decision.correlationId}:${input.resolution}`;
    const commandCorrelationId = `${correlationId}:${randomUUID().slice(0, 8)}`;
    const updatePayload: {
      decisionId: string;
      status: "approved" | "rejected" | "modified";
      resolvedAt: Date;
      snapshotJson?: Record<string, unknown>;
    } = {
      decisionId: input.decision.id,
      status: input.nextStatus,
      resolvedAt: new Date()
    };
    if (input.snapshotJson) {
      updatePayload.snapshotJson = input.snapshotJson;
    }

    await this.repo.updateDecision(updatePayload);

    await this.repo.createDecisionAction({
      decisionId: input.decision.id,
      actorType: input.actor.actorType,
      actorRef: input.actor.actorRef,
      actionType: input.actionType,
      payloadJson: input.payloadJson
    });

    const rule = getDecisionRule(input.decision.decisionType);
    const commandPayload: Record<string, unknown> = {
      decision_id: input.decision.id,
      session_id: input.decision.sessionId,
      runtime_id: input.decision.runtimeId,
      resolution: input.resolution,
      recommended_option: input.decision.recommendedOption,
      modified_fields: input.payloadJson.modified_fields ?? null,
      decision_type: input.decision.decisionType,
      generates_command_type: rule?.generates_command_type ?? null,
      correlation_id: commandCorrelationId
    };
    if (input.resolution === "approve") {
      commandPayload.approved_option = input.decision.recommendedOption;
    }

    const command = await this.repo.createCommand({
      runtimeId: input.decision.runtimeId,
      decisionId: input.decision.id,
      commandType: "approval_resolved",
      payloadJson: commandPayload
    });
    if (!command) {
      throw new AppError("COMMAND_OUTBOX_WRITE_FAILED", 500);
    }

    await this.applyResolutionLedgerEffects(input.decision, input.resolution, input.payloadJson);

    await this.repo.createAuditLog({
      actorType: input.actor.actorType,
      actorRef: input.actor.actorRef,
      action: `decision_${input.resolution}`,
      targetType: "decision",
      targetId: input.decision.id,
      correlationId,
      payloadJson: {
        status: input.nextStatus,
        command_id: command.id,
        ...input.payloadJson
      }
    });

    const activeLink = await this.repo.findActiveTelegramLinkByRuntime(input.decision.runtimeId);
    if (activeLink) {
      await this.telegramSender.sendDecisionResolved({
        chatId: activeLink.telegramChatId,
        decisionId: input.decision.id,
        clawName: await this.getClawName(input.decision.runtimeId),
        resolution: input.resolution,
        summary:
          input.resolution === "modify"
            ? JSON.stringify(input.payloadJson.modified_fields)
            : input.decision.title
      });
    }

    return {
      decision_id: input.decision.id,
      status: input.nextStatus,
      command_id: command.id,
      idempotent: false
    };
  }

  private async getAuthorizedDecision(decisionId: string, userId?: string) {
    if (userId) {
      const decision = await this.repo.findDecisionByIdForUser(decisionId, userId);
      if (!decision) {
        throw new AppError("DECISION_NOT_FOUND_OR_FORBIDDEN", 404);
      }
      return this.normalizeDecision(decision);
    }

    const decision = await this.repo.findDecisionById(decisionId);
    if (!decision) {
      throw new AppError("DECISION_NOT_FOUND", 404);
    }
    return this.normalizeDecision(decision);
  }

  private validateModification(field: DecisionModifyField, rawValue: string) {
    if (field === "quantity" || field === "budget_cap") {
      const numericValue = Number(rawValue);
      if (!Number.isInteger(numericValue) || numericValue <= 0) {
        throw new AppError("COMMAND_PATCH_INVALID", 400, "expected a positive integer");
      }
      return numericValue;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (["low", "medium", "high"].includes(normalized)) {
      return normalized;
    }

    const numericRisk = Number(rawValue);
    if (Number.isInteger(numericRisk) && numericRisk >= 0 && numericRisk <= 100) {
      return numericRisk;
    }

    throw new AppError("COMMAND_PATCH_INVALID", 400, "invalid route_risk value");
  }

  private async maybeWriteTradeReserve(decision: DecisionRecord) {
    if (decision.decisionType !== "high_value_trade") {
      return;
    }

    const commitment = this.extractTradeCommitment(decision.snapshotJson);
    if (!commitment) {
      return;
    }

    await this.repo.createLedgerEntries([
      {
        domain: "frozen_commitment",
        entryType: "reserve",
        ownerType: "runtime",
        ownerId: decision.runtimeId,
        counterpartyType: "facility",
        counterpartyId: this.extractFacilityId(decision.snapshotJson),
        resourceType: commitment.resourceType,
        quantity: commitment.quantity,
        unit: commitment.unit,
        sourceType: "decision",
        sourceId: decision.id,
        causedByAction: "trade",
        causedByEvent: "decision.created",
        decisionId: decision.id,
        sessionId: decision.sessionId,
        worldTick: this.extractWorldTick(decision.snapshotJson),
        status: "frozen",
        metadataJson: {
          correlation_id: decision.correlationId
        }
      }
    ]);
  }

  private async applyResolutionLedgerEffects(
    decision: DecisionRecord,
    resolution: "approve" | "reject" | "modify",
    payloadJson: Record<string, unknown>
  ) {
    if (decision.decisionType !== "high_value_trade") {
      return;
    }

    const commitment = this.extractTradeCommitment(decision.snapshotJson, payloadJson);
    if (!commitment) {
      return;
    }

    if (resolution === "approve" || resolution === "modify") {
      await this.repo.createLedgerEntries([
        {
          domain: "trade_settlement",
          entryType: "finalize",
          ownerType: "runtime",
          ownerId: decision.runtimeId,
          counterpartyType: "facility",
          counterpartyId: this.extractFacilityId(decision.snapshotJson),
          resourceType: commitment.resourceType,
          quantity: commitment.quantity,
          unit: commitment.unit,
          sourceType: "decision",
          sourceId: decision.id,
          causedByAction: "trade",
          causedByEvent: "decision.approved",
          decisionId: decision.id,
          sessionId: decision.sessionId,
          worldTick: this.extractWorldTick(decision.snapshotJson),
          status: "finalized",
          metadataJson: {
            resolution
          },
          finalizedAt: new Date()
        }
      ]);
      return;
    }

    await this.repo.createLedgerEntries([
      {
        domain: "frozen_commitment",
        entryType: "release",
        ownerType: "runtime",
        ownerId: decision.runtimeId,
        counterpartyType: "facility",
        counterpartyId: this.extractFacilityId(decision.snapshotJson),
        resourceType: commitment.resourceType,
        quantity: commitment.quantity,
        unit: commitment.unit,
        sourceType: "decision",
        sourceId: decision.id,
        causedByAction: "trade",
        causedByEvent: "decision.rejected",
        decisionId: decision.id,
        sessionId: decision.sessionId,
        worldTick: this.extractWorldTick(decision.snapshotJson),
        status: "finalized",
        metadataJson: {
          resolution
        },
        finalizedAt: new Date()
      }
    ]);
  }

  private extractTradeCommitment(
    snapshot: Record<string, unknown>,
    payloadJson?: Record<string, unknown>
  ): { quantity: number; resourceType: string; unit: string } | null {
    const modifiedFields = this.asRecord(payloadJson?.modified_fields);
    const overriddenBudget = modifiedFields?.budget_cap;
    const estimatedSpend = this.asRecord(snapshot.trade)?.estimated_spend;
    const amount = overriddenBudget ?? estimatedSpend;

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    return {
      quantity: Math.trunc(amount),
      resourceType: "credits",
      unit: "unit"
    };
  }

  private extractFacilityId(snapshot: Record<string, unknown>) {
    const trade = this.asRecord(snapshot.trade);
    const counterparty = trade?.counterparty;
    return typeof counterparty === "string" ? counterparty : "unknown_facility";
  }

  private extractWorldTick(snapshot: Record<string, unknown>) {
    const worldTick = snapshot.world_tick;
    return typeof worldTick === "number" ? Math.trunc(worldTick) : 0;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private normalizeDecision(
    decision: NonNullable<
      Awaited<ReturnType<DecisionRepository["findDecisionById"]>> | Awaited<ReturnType<DecisionRepository["findDecisionByIdForUser"]>>
    >
  ): DecisionRecord {
    return {
      id: decision.id,
      runtimeId: decision.runtimeId,
      sessionId: decision.sessionId,
      decisionType: decision.decisionType,
      title: decision.title,
      reason: decision.reason,
      riskLevel: decision.riskLevel,
      status: decision.status,
      recommendedOption: decision.recommendedOption,
      optionsJson: Array.isArray(decision.optionsJson) ? (decision.optionsJson as Record<string, unknown>[]) : [],
      snapshotJson: this.asRecord(decision.snapshotJson) ?? {},
      expiresAt: decision.expiresAt,
      correlationId: decision.correlationId,
      resolvedAt: decision.resolvedAt ?? null
    };
  }

  private async getClawName(runtimeId: string) {
    const runtime = await this.repo.findRuntime(runtimeId);
    return runtime?.clawName ?? "Claw";
  }
}
