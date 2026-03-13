import { randomUUID } from "node:crypto";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  auditLogs,
  commandOutbox,
  decisions,
  idempotencyKeys,
  ledgerEntries,
  runtimeEvents,
  runtimeHeartbeats,
  runtimeSessions,
  runtimes,
  telegramLinks,
  users
} from "../../../../../drizzle/schema";
import type { db } from "../../db/client";

type Database = typeof db;

export class RuntimeRepository {
  constructor(private readonly database: Database) {}

  async findUserByExternalRef(userRef: string) {
    return this.database.query.users.findFirst({
      where: eq(users.externalRef, userRef)
    });
  }

  async createUserIfMissing(userRef: string) {
    const existing = await this.findUserByExternalRef(userRef);
    if (existing) {
      return existing;
    }

    const [user] = await this.database
      .insert(users)
      .values({
        externalRef: userRef,
        displayName: userRef
      })
      .returning();

    return user;
  }

  async findPendingTelegramLink(userId: string) {
    return this.database.query.telegramLinks.findFirst({
      where: and(eq(telegramLinks.userId, userId), eq(telegramLinks.status, "pending"))
    });
  }

  async createPendingTelegramLink(userId: string, linkCode: string) {
    const [link] = await this.database
      .insert(telegramLinks)
      .values({
        userId,
        telegramChatId: `pending:${linkCode}`,
        telegramUserId: `pending:${linkCode}`,
        linkCode,
        status: "pending"
      })
      .returning();

    return link;
  }

  async createRuntime(input: {
    userId: string;
    clawName: string;
    runtimeName: string;
    authTokenHash: string;
    runtimeVersion: string;
    status: "registered" | "active";
  }) {
    const [runtime] = await this.database.insert(runtimes).values(input).returning();
    return runtime;
  }

  async createRuntimeSession(input: {
    runtimeId: string;
    worldId: string;
    currentSector: string;
    sessionStatus: "pending" | "active";
  }) {
    const [session] = await this.database
      .insert(runtimeSessions)
      .values({
        runtimeId: input.runtimeId,
        worldId: input.worldId,
        currentSector: input.currentSector,
        sessionStatus: input.sessionStatus
      })
      .returning();

    return session;
  }

  async findRuntimeByIdAndTokenHash(runtimeId: string, authTokenHash: string) {
    return this.database.query.runtimes.findFirst({
      where: and(eq(runtimes.id, runtimeId), eq(runtimes.authTokenHash, authTokenHash))
    });
  }

  async findSession(sessionId: string, runtimeId: string) {
    return this.database.query.runtimeSessions.findFirst({
      where: and(eq(runtimeSessions.id, sessionId), eq(runtimeSessions.runtimeId, runtimeId))
    });
  }

  async insertHeartbeat(input: {
    runtimeId: string;
    sessionId: string;
    power: number;
    durability: number;
    credits: number;
    currentAction: string;
    currentSector: string;
    summaryJson: Record<string, unknown>;
  }) {
    const [heartbeat] = await this.database
      .insert(runtimeHeartbeats)
      .values(input)
      .returning();
    return heartbeat;
  }

  async updateRuntimeState(input: {
    runtimeId: string;
    status: "registered" | "active" | "stale" | "offline";
    lastSeenAt?: Date;
  }) {
    const [runtime] = await this.database
      .update(runtimes)
      .set({
        status: input.status,
        lastSeenAt: input.lastSeenAt,
        updatedAt: new Date()
      })
      .where(eq(runtimes.id, input.runtimeId))
      .returning();

    return runtime;
  }

  async updateSessionState(input: {
    sessionId: string;
    currentSector: string;
    currentTick?: number;
  }) {
    const [session] = await this.database
      .update(runtimeSessions)
      .set({
        currentSector: input.currentSector,
        currentTick: input.currentTick ?? sql`${runtimeSessions.currentTick}`,
        updatedAt: new Date()
      })
      .where(eq(runtimeSessions.id, input.sessionId))
      .returning();

    return session;
  }

  async countPendingCommands(runtimeId: string) {
    const [result] = await this.database
      .select({ value: count() })
      .from(commandOutbox)
      .where(and(eq(commandOutbox.runtimeId, runtimeId), eq(commandOutbox.status, "queued")));

    return result?.value ?? 0;
  }

  async getQueuedCommands(runtimeId: string) {
    return this.database
      .select({
        id: commandOutbox.id,
        commandType: commandOutbox.commandType,
        payloadJson: commandOutbox.payloadJson,
        decisionId: commandOutbox.decisionId,
        createdAt: commandOutbox.createdAt
      })
      .from(commandOutbox)
      .where(and(eq(commandOutbox.runtimeId, runtimeId), eq(commandOutbox.status, "queued")))
      .orderBy(commandOutbox.queuedAt);
  }

  async markCommandsDelivered(commandIds: string[]) {
    if (commandIds.length === 0) {
      return [];
    }

    return this.database
      .update(commandOutbox)
      .set({
        status: "delivered",
        deliveredAt: new Date(),
        updatedAt: new Date()
      })
      .where(inArray(commandOutbox.id, commandIds))
      .returning();
  }

  async findIdempotencyKey(scope: string, idemKey: string) {
    return this.database.query.idempotencyKeys.findFirst({
      where: and(eq(idempotencyKeys.scope, scope), eq(idempotencyKeys.idemKey, idemKey))
    });
  }

  async createIdempotencyKey(input: {
    scope: string;
    idemKey: string;
    requestHash: string;
    expiresAt: Date;
  }) {
    const [record] = await this.database
      .insert(idempotencyKeys)
      .values({
        scope: input.scope,
        idemKey: input.idemKey,
        requestHash: input.requestHash,
        expiresAt: input.expiresAt
      })
      .returning();
    return record;
  }

  async createRuntimeEvent(input: {
    runtimeId: string;
    sessionId: string;
    eventType: string;
    severity: "low" | "medium" | "high" | "critical";
    correlationId: string;
    payloadJson: Record<string, unknown>;
  }) {
    const [event] = await this.database.insert(runtimeEvents).values(input).returning();
    return event;
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

  async findCommandByCorrelation(runtimeId: string, correlationId: string) {
    const rows = await this.database
      .select()
      .from(commandOutbox)
      .where(
        and(
          eq(commandOutbox.runtimeId, runtimeId),
          sql`${commandOutbox.payloadJson} ->> 'correlation_id' = ${correlationId}`
        )
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async markCommandAcknowledged(commandId: string) {
    const [command] = await this.database
      .update(commandOutbox)
      .set({
        status: "acknowledged",
        acknowledgedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(commandOutbox.id, commandId))
      .returning();

    return command;
  }

  async markDecisionResolved(decisionId: string) {
    const [decision] = await this.database
      .update(decisions)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(decisions.id, decisionId))
      .returning();

    return decision;
  }

  async getRuntimeEvents(runtimeId: string) {
    return this.database.query.runtimeEvents.findMany({
      where: eq(runtimeEvents.runtimeId, runtimeId),
      orderBy: desc(runtimeEvents.createdAt)
    });
  }

  async insertAuditLog(input: {
    actorType: string;
    actorRef: string;
    action: string;
    targetType: string;
    targetId: string;
    correlationId: string | null;
    payloadJson: Record<string, unknown>;
  }) {
    await this.database.insert(auditLogs).values({
      actorType: input.actorType,
      actorRef: input.actorRef,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      correlationId: input.correlationId,
      payloadJson: input.payloadJson
    });
  }

  createLinkCode() {
    return `claw-${randomUUID().slice(0, 8)}`;
  }
}
