import { and, desc, eq, inArray } from "drizzle-orm";
import {
  decisions,
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

export class MeRepository {
  constructor(private readonly database: Database) {}

  async findUserByExternalRef(userRef: string) {
    return this.database.query.users.findFirst({
      where: eq(users.externalRef, userRef)
    });
  }

  async listRuntimesForUser(userId: string) {
    return this.database.query.runtimes.findMany({
      where: eq(runtimes.userId, userId),
      orderBy: desc(runtimes.lastSeenAt)
    });
  }

  async findLatestHeartbeat(runtimeId: string) {
    return this.database.query.runtimeHeartbeats.findFirst({
      where: eq(runtimeHeartbeats.runtimeId, runtimeId),
      orderBy: desc(runtimeHeartbeats.heartbeatAt)
    });
  }

  async findLatestSession(runtimeId: string) {
    return this.database.query.runtimeSessions.findFirst({
      where: eq(runtimeSessions.runtimeId, runtimeId),
      orderBy: desc(runtimeSessions.startedAt)
    });
  }

  async countPendingDecisions(runtimeIds: string[]) {
    if (runtimeIds.length === 0) {
      return 0;
    }

    const decisionsList = await this.database.query.decisions.findMany({
      where: and(inArray(decisions.runtimeId, runtimeIds), inArray(decisions.status, ["pending", "waiting_user_response"]))
    });

    return decisionsList.length;
  }

  async listPendingDecisions(runtimeIds: string[]) {
    if (runtimeIds.length === 0) {
      return [];
    }

    return this.database.query.decisions.findMany({
      where: and(inArray(decisions.runtimeId, runtimeIds), inArray(decisions.status, ["pending", "waiting_user_response"])),
      orderBy: desc(decisions.createdAt)
    });
  }

  async listRuntimeEvents(runtimeIds: string[], limit: number) {
    if (runtimeIds.length === 0) {
      return [];
    }

    return this.database.query.runtimeEvents.findMany({
      where: inArray(runtimeEvents.runtimeId, runtimeIds),
      orderBy: desc(runtimeEvents.createdAt),
      limit
    });
  }

  async listLedgerEntries(runtimeIds: string[], limit: number) {
    if (runtimeIds.length === 0) {
      return [];
    }

    return this.database.query.ledgerEntries.findMany({
      where: inArray(ledgerEntries.ownerId, runtimeIds),
      orderBy: desc(ledgerEntries.createdAt),
      limit
    });
  }

  async findActiveTelegramLink(userId: string) {
    return this.database.query.telegramLinks.findFirst({
      where: and(eq(telegramLinks.userId, userId), eq(telegramLinks.status, "active"))
    });
  }
}
