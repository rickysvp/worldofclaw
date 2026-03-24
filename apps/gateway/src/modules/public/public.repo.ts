import { desc, eq, inArray } from "drizzle-orm";
import { decisions, runtimeEvents, runtimeHeartbeats, runtimeSessions, runtimes } from "../../../../../drizzle/schema";
import type { db } from "../../db/client";

type Database = typeof db;

export class PublicRepository {
  constructor(private readonly database: Database) {}

  async listRuntimes() {
    return this.database.query.runtimes.findMany({
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

  async listRecentRuntimeEvents(limit: number) {
    return this.database.query.runtimeEvents.findMany({
      limit,
      orderBy: desc(runtimeEvents.createdAt)
    });
  }

  async listRuntimesByIds(runtimeIds: string[]) {
    if (runtimeIds.length === 0) {
      return [];
    }

    return this.database.query.runtimes.findMany({
      where: inArray(runtimes.id, runtimeIds)
    });
  }

  async listSessionsByIds(sessionIds: string[]) {
    if (sessionIds.length === 0) {
      return [];
    }

    return this.database.query.runtimeSessions.findMany({
      where: inArray(runtimeSessions.id, sessionIds)
    });
  }

  async listPendingDecisions() {
    return this.database.query.decisions.findMany({
      where: inArray(decisions.status, ["pending", "waiting_user_response"])
    });
  }
}
