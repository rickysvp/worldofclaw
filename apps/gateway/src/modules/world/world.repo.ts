import { count, desc, eq, sql, isNotNull } from "drizzle-orm";
import {
  runtimeHeartbeats,
  runtimeSessions,
  runtimes,
  runtimeEvents
} from "../../../../../drizzle/schema";
import type { Database } from "../../db/client";

export class WorldRepository {
  constructor(private readonly database: Database) {}

  async getWorldStatus() {
    // Get latest tick from any session
    const [tickResult] = await this.database
      .select({ value: sql<string>`COALESCE(MAX(${runtimeSessions.currentTick}), 0)` })
      .from(runtimeSessions);

    // Get active runtimes count
    const [activeResult] = await this.database
      .select({ value: count() })
      .from(runtimes)
      .where(sql`${runtimes.status} IN ('active', 'registered')`);

    // Get total credits (sum from latest heartbeats)
    const creditsResult = await this.database
      .select({ totalCredits: sql<string>`COALESCE(SUM(${runtimeHeartbeats.credits}), 0)` })
      .from(runtimeHeartbeats)
      .innerJoin(runtimeSessions, eq(runtimeSessions.id, runtimeHeartbeats.sessionId))
      .where(eq(runtimeSessions.sessionStatus, "active"));

    const totalCredits = creditsResult[0]?.totalCredits ?? "0";

    // Format total production (credits / 100 as simplified "production")
    const totalProductionNum = Number(totalCredits);
    const totalProduction = totalProductionNum >= 1000
      ? `${(totalProductionNum / 1000).toFixed(1)}K`
      : totalProductionNum.toString();

    // Get recent events for broadcast message
    const recentEvents = await this.database
      .select()
      .from(runtimeEvents)
      .orderBy(desc(runtimeEvents.createdAt))
      .limit(5);

    let broadcast = "世界运行正常。所有 Claw 保持当前任务。";
    if (recentEvents.length > 0) {
      const latest = recentEvents[0];
      broadcast = `最新事件: ${latest.eventType} - Tick ${tickResult?.value ?? 0}`;
    }

    return {
      tick: Number(tickResult?.value ?? 0),
      totalProduction,
      activeClaws: Number(activeResult?.value ?? 0),
      openSectors: 25, // map_width * map_height = 5 * 5
      activeOrgs: 3,
      contestedSectors: 0,
      broadcast
    };
  }

  async getRuntimes() {
    // Get latest heartbeat for each runtime
    const rows = await this.database
      .select({
        id: runtimes.id,
        clawName: runtimes.clawName,
        credits: runtimeHeartbeats.credits,
        currentSector: runtimeSessions.currentSector,
        lastHeartbeat: runtimeSessions.updatedAt,
        status: runtimes.status
      })
      .from(runtimes)
      .leftJoin(
        runtimeSessions,
        sql`${runtimeSessions.runtimeId} = ${runtimes.id} AND ${runtimeSessions.sessionStatus} = 'active'`
      )
      .leftJoin(
        runtimeHeartbeats,
        sql`${runtimeHeartbeats.runtimeId} = ${runtimes.id}`
      )
      .where(sql`${runtimes.status} IN ('active', 'registered')`)
      .orderBy(desc(runtimes.createdAt))
      .limit(50);

    return rows.map((row) => ({
      id: row.id,
      claw_name: row.clawName,
      credits: Number(row.credits ?? 0),
      current_sector: row.currentSector ?? "unknown",
      last_heartbeat: row.lastHeartbeat?.toISOString() ?? null,
      status: row.status ?? "offline"
    }));
  }

  async getEvents(limit = 50) {
    const rows = await this.database
      .select({
        id: runtimeEvents.id,
        tick: runtimeSessions.currentTick,
        type: runtimeEvents.eventType,
        message: sql<string>`${runtimeEvents.payloadJson}->>'message'`,
        severity: runtimeEvents.severity
      })
      .from(runtimeEvents)
      .leftJoin(runtimeSessions, eq(runtimeSessions.id, runtimeEvents.sessionId))
      .orderBy(desc(runtimeEvents.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      tick: Number(row.tick ?? 0),
      type: row.type,
      message: row.message ?? row.type,
      severity: row.severity
    }));
  }
}
