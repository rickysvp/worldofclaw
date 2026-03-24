import { WORLD_ID } from "../../../../../packages/shared/src/constants";
import { PublicRepository } from "./public.repo";

export class PublicService {
  constructor(private readonly repo: PublicRepository) {}

  async getWorldFeed(limit = 20) {
    const events = await this.repo.listRecentRuntimeEvents(limit);
    const runtimeMap = new Map(
      (await this.repo.listRuntimesByIds(events.map((event) => event.runtimeId))).map((runtime) => [runtime.id, runtime])
    );
    const sessionMap = new Map(
      (await this.repo.listSessionsByIds(events.map((event) => event.sessionId))).map((session) => [session.id, session])
    );

    return {
      data: events.map((event) => {
        const runtime = runtimeMap.get(event.runtimeId);
        const session = sessionMap.get(event.sessionId);
        const payload = this.asRecord(event.payloadJson);

        return {
          id: event.id,
          occurred_at: event.createdAt.toISOString(),
          event_type: event.eventType,
          severity: event.severity,
          title: this.readString(payload.title) ?? this.toTitle(event.eventType),
          summary:
            this.readString(payload.summary) ??
            this.readString(this.asRecord(payload.result).summary) ??
            this.toTitle(event.eventType),
          claw_name: runtime?.clawName ?? "Unknown Claw",
          current_sector: session?.currentSector ?? null,
          runtime_id: event.runtimeId
        };
      })
    };
  }

  async getLeaderboard(limit = 10) {
    const runtimes = await this.repo.listRuntimes();
    const rows = [];

    for (const runtime of runtimes) {
      const [heartbeat, session] = await Promise.all([
        this.repo.findLatestHeartbeat(runtime.id),
        this.repo.findLatestSession(runtime.id)
      ]);

      rows.push({
        runtime_id: runtime.id,
        claw_name: runtime.clawName,
        runtime_status: runtime.status,
        current_sector: session?.currentSector ?? "unknown",
        credits: heartbeat?.credits ?? 0,
        power: heartbeat?.power ?? 0,
        durability: heartbeat?.durability ?? 0,
        last_seen_at: runtime.lastSeenAt?.toISOString() ?? null
      });
    }

    return {
      data: rows
        .sort((left, right) => right.credits - left.credits || right.power - left.power)
        .slice(0, limit)
        .map((row, index) => ({
          rank: index + 1,
          ...row
        }))
    };
  }

  async getWorldStatus() {
    const [runtimes, pendingDecisions, worldFeed] = await Promise.all([
      this.repo.listRuntimes(),
      this.repo.listPendingDecisions(),
      this.getWorldFeed(1)
    ]);

    let latestTick = 0;
    let liveEventCount = 0;

    for (const runtime of runtimes) {
      const [heartbeat, session] = await Promise.all([
        this.repo.findLatestHeartbeat(runtime.id),
        this.repo.findLatestSession(runtime.id)
      ]);

      const heartbeatTick = this.readNumber(this.asRecord(heartbeat?.summaryJson).current_tick);
      latestTick = Math.max(latestTick, heartbeatTick ?? session?.currentTick ?? 0);
      if (heartbeat) {
        liveEventCount += 1;
      }
    }

    return {
      data: {
        world_id: WORLD_ID,
        active_runtimes: runtimes.filter((runtime) => runtime.status === "active" || runtime.status === "registered").length,
        stale_runtimes: runtimes.filter((runtime) => runtime.status === "stale").length,
        offline_runtimes: runtimes.filter((runtime) => runtime.status === "offline").length,
        pending_decision_count: pendingDecisions.length,
        latest_tick: latestTick,
        live_event_count: liveEventCount,
        latest_broadcast: worldFeed.data[0]?.summary ?? null
      }
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private readString(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  private readNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
  }

  private toTitle(eventType: string) {
    return eventType
      .split(".")
      .map((part) => part.replace(/_/g, " "))
      .join(" / ");
  }
}
