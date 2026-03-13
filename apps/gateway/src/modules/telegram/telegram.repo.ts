import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  auditLogs,
  decisions,
  idempotencyKeys,
  runtimeHeartbeats,
  runtimeSessions,
  runtimes,
  telegramLinks
} from "../../../../../drizzle/schema";
import type { db } from "../../db/client";

type Database = typeof db;

export class TelegramRepository {
  constructor(private readonly database: Database) {}

  async findActiveLinkByChatId(chatId: string) {
    return this.database.query.telegramLinks.findFirst({
      where: and(eq(telegramLinks.telegramChatId, chatId), eq(telegramLinks.status, "active"))
    });
  }

  async findLinkByCode(linkCode: string) {
    return this.database.query.telegramLinks.findFirst({
      where: eq(telegramLinks.linkCode, linkCode)
    });
  }

  async activateLink(input: {
    linkId: string;
    chatId: string;
    telegramUserId: string;
  }) {
    const [link] = await this.database
      .update(telegramLinks)
      .set({
        telegramChatId: input.chatId,
        telegramUserId: input.telegramUserId,
        status: "active",
        linkedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(telegramLinks.id, input.linkId))
      .returning();

    return link;
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
    const [record] = await this.database.insert(idempotencyKeys).values(input).returning();
    return record;
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

  async getStatusSummaryByUser(userId: string) {
    const runtimeRows = await this.database
      .select({
        id: runtimes.id,
        clawName: runtimes.clawName,
        status: runtimes.status,
        lastSeenAt: runtimes.lastSeenAt,
        currentSector: runtimeSessions.currentSector,
        currentAction: runtimeHeartbeats.currentAction,
        power: runtimeHeartbeats.power,
        durability: runtimeHeartbeats.durability,
        credits: runtimeHeartbeats.credits
      })
      .from(runtimes)
      .leftJoin(runtimeSessions, eq(runtimeSessions.runtimeId, runtimes.id))
      .leftJoin(
        runtimeHeartbeats,
        and(
          eq(runtimeHeartbeats.runtimeId, runtimes.id),
          eq(runtimeHeartbeats.sessionId, runtimeSessions.id)
        )
      )
      .where(eq(runtimes.userId, userId))
      .orderBy(desc(runtimes.lastSeenAt))
      .limit(1);

    const runtimeRow = runtimeRows[0] ?? null;
    if (!runtimeRow) {
      return null;
    }

    const [pendingResult] = await this.database
      .select({ value: count() })
      .from(decisions)
      .innerJoin(runtimes, eq(decisions.runtimeId, runtimes.id))
      .where(
        and(
          eq(runtimes.userId, userId),
          inArray(decisions.status, ["pending", "waiting_user_response"])
        )
      );

    return {
      ...runtimeRow,
      pendingDecisionCount: pendingResult?.value ?? 0
    };
  }

  async findClawNameByUser(userId: string) {
    const row = await this.database.query.runtimes.findFirst({
      where: eq(runtimes.userId, userId),
      orderBy: desc(runtimes.createdAt)
    });
    return row?.clawName ?? "Claw";
  }

  async listStaleActiveLinks(staleBefore: Date) {
    return this.database
      .select({
        runtimeId: runtimes.id,
        clawName: runtimes.clawName,
        telegramChatId: telegramLinks.telegramChatId
      })
      .from(runtimes)
      .innerJoin(telegramLinks, and(eq(telegramLinks.userId, runtimes.userId), eq(telegramLinks.status, "active")))
      .where(
        and(
          inArray(runtimes.status, ["registered", "active", "stale"]),
          sql`${runtimes.lastSeenAt} is not null`,
          sql`${runtimes.lastSeenAt} < ${staleBefore}`
        )
      );
  }

  async markRuntimeStale(runtimeId: string) {
    const [runtime] = await this.database
      .update(runtimes)
      .set({
        status: "stale",
        updatedAt: new Date()
      })
      .where(eq(runtimes.id, runtimeId))
      .returning();

    return runtime;
  }
}
