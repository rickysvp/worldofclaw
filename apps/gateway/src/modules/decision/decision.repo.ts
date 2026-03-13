import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import {
  auditLogs,
  commandOutbox,
  decisionActions,
  decisions,
  idempotencyKeys,
  ledgerEntries,
  runtimeSessions,
  runtimes,
  telegramLinks
} from "../../../../../drizzle/schema";
import type { db } from "../../db/client";

type Database = typeof db;

export class DecisionRepository {
  constructor(private readonly database: Database) {}

  async findRuntime(runtimeId: string) {
    return this.database.query.runtimes.findFirst({
      where: eq(runtimes.id, runtimeId)
    });
  }

  async findSession(sessionId: string, runtimeId: string) {
    return this.database.query.runtimeSessions.findFirst({
      where: and(eq(runtimeSessions.id, sessionId), eq(runtimeSessions.runtimeId, runtimeId))
    });
  }

  async findRuntimeByIdAndTokenHash(runtimeId: string, authTokenHash: string) {
    return this.database.query.runtimes.findFirst({
      where: and(eq(runtimes.id, runtimeId), eq(runtimes.authTokenHash, authTokenHash))
    });
  }

  async findDecisionByCorrelationId(correlationId: string) {
    return this.database.query.decisions.findFirst({
      where: eq(decisions.correlationId, correlationId)
    });
  }

  async findDecisionById(decisionId: string) {
    return this.database.query.decisions.findFirst({
      where: eq(decisions.id, decisionId)
    });
  }

  async findDecisionByIdForUser(decisionId: string, userId: string) {
    const rows = await this.database
      .select({
        id: decisions.id,
        runtimeId: decisions.runtimeId,
        sessionId: decisions.sessionId,
        decisionType: decisions.decisionType,
        title: decisions.title,
        reason: decisions.reason,
        riskLevel: decisions.riskLevel,
        status: decisions.status,
        recommendedOption: decisions.recommendedOption,
        optionsJson: decisions.optionsJson,
        snapshotJson: decisions.snapshotJson,
        expiresAt: decisions.expiresAt,
        correlationId: decisions.correlationId,
        resolvedAt: decisions.resolvedAt,
        runtimeUserId: runtimes.userId
      })
      .from(decisions)
      .innerJoin(runtimes, eq(decisions.runtimeId, runtimes.id))
      .where(and(eq(decisions.id, decisionId), eq(runtimes.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async findIdempotencyKey(scope: string, idemKey: string) {
    return this.database.query.idempotencyKeys.findFirst({
      where: and(eq(idempotencyKeys.scope, scope), eq(idempotencyKeys.idemKey, idemKey))
    });
  }

  async createIdempotencyRecord(input: {
    idemKey: string;
    scope: string;
    requestHash: string;
    expiresAt: Date;
  }) {
    const [record] = await this.database.insert(idempotencyKeys).values(input).returning();
    return record;
  }

  async createDecision(input: {
    runtimeId: string;
    sessionId: string;
    decisionType: string;
    title: string;
    reason: string;
    riskLevel: "low" | "medium" | "high";
    recommendedOption: string;
    optionsJson: Record<string, unknown>[];
    snapshotJson: Record<string, unknown>;
    expiresAt: Date;
    correlationId: string;
    status: "pending" | "waiting_user_response";
  }) {
    const [decision] = await this.database.insert(decisions).values(input).returning();
    return decision;
  }

  async updateDecision(input: {
    decisionId: string;
    status: "pending" | "waiting_user_response" | "approved" | "rejected" | "modified" | "expired" | "resolved";
    snapshotJson?: Record<string, unknown>;
    resolvedAt?: Date | null;
  }) {
    const [decision] = await this.database
      .update(decisions)
      .set({
        status: input.status,
        snapshotJson: input.snapshotJson ?? sql`${decisions.snapshotJson}`,
        resolvedAt: input.resolvedAt === undefined ? sql`${decisions.resolvedAt}` : input.resolvedAt,
        updatedAt: new Date()
      })
      .where(eq(decisions.id, input.decisionId))
      .returning();

    return decision;
  }

  async createDecisionAction(input: {
    decisionId: string;
    actorType: "system" | "user" | "runtime" | "telegram";
    actorRef: string;
    actionType: "system_created" | "telegram_sent" | "approved" | "rejected" | "modified" | "expired";
    payloadJson: Record<string, unknown>;
  }) {
    const [record] = await this.database.insert(decisionActions).values(input).returning();
    return record;
  }

  async findLatestDecisionAction(decisionId: string, actionType?: string) {
    return this.database.query.decisionActions.findFirst({
      where: actionType
        ? and(eq(decisionActions.decisionId, decisionId), eq(decisionActions.actionType, actionType as never))
        : eq(decisionActions.decisionId, decisionId),
      orderBy: desc(decisionActions.createdAt)
    });
  }

  async createCommand(input: {
    runtimeId: string;
    decisionId: string | null;
    commandType: string;
    payloadJson: Record<string, unknown>;
    status?: "queued" | "delivered" | "acknowledged" | "failed";
  }) {
    const [command] = await this.database
      .insert(commandOutbox)
      .values({
        runtimeId: input.runtimeId,
        decisionId: input.decisionId,
        commandType: input.commandType,
        payloadJson: input.payloadJson,
        status: input.status ?? "queued"
      })
      .returning();

    return command;
  }

  async findLatestCommandForDecision(decisionId: string) {
    return this.database.query.commandOutbox.findFirst({
      where: eq(commandOutbox.decisionId, decisionId),
      orderBy: desc(commandOutbox.createdAt)
    });
  }

  async createAuditLog(input: {
    actorType: string;
    actorRef: string;
    action: string;
    targetType: string;
    targetId: string;
    correlationId: string | null;
    payloadJson: Record<string, unknown>;
  }) {
    await this.database.insert(auditLogs).values(input);
  }

  async findActiveTelegramLinkByRuntime(runtimeId: string) {
    const rows = await this.database
      .select({
        id: telegramLinks.id,
        userId: telegramLinks.userId,
        telegramChatId: telegramLinks.telegramChatId,
        telegramUserId: telegramLinks.telegramUserId,
        linkCode: telegramLinks.linkCode
      })
      .from(telegramLinks)
      .innerJoin(runtimes, eq(telegramLinks.userId, runtimes.userId))
      .where(and(eq(runtimes.id, runtimeId), eq(telegramLinks.status, "active")))
      .limit(1);

    return rows[0] ?? null;
  }

  async createLedgerEntries(
    entries: Array<{
      domain: string;
      entryType: string;
      ownerType: string;
      ownerId: string;
      counterpartyType?: string | null;
      counterpartyId?: string | null;
      resourceType: string;
      quantity: number;
      unit: string;
      sourceType: string;
      sourceId: string;
      causedByAction?: string | null;
      causedByEvent?: string | null;
      decisionId?: string | null;
      sessionId?: string | null;
      worldTick: number;
      status: "pending" | "frozen" | "finalized" | "reversed";
      metadataJson: Record<string, unknown>;
      finalizedAt?: Date;
    }>
  ) {
    if (entries.length === 0) {
      return [];
    }

    return this.database.insert(ledgerEntries).values(entries).returning();
  }

  async listExpiredOpenDecisions(limit: number, now: Date) {
    return this.database.query.decisions.findMany({
      where: and(
        inArray(decisions.status, ["pending", "waiting_user_response"]),
        lte(decisions.expiresAt, now)
      ),
      limit
    });
  }

  async listDecisionActions(decisionId: string) {
    return this.database.query.decisionActions.findMany({
      where: eq(decisionActions.decisionId, decisionId),
      orderBy: desc(decisionActions.createdAt)
    });
  }
}
