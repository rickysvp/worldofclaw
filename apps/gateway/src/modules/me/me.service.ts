import { MeRepository } from "./me.repo";

export class MeService {
  constructor(private readonly repo: MeRepository) {}

  async getClawSummary(userRef: string) {
    const user = await this.repo.findUserByExternalRef(userRef);
    if (!user) {
      return {
        data: null
      };
    }

    const runtimes = await this.repo.listRuntimesForUser(user.id);
    const runtime = runtimes[0];
    if (!runtime) {
      return {
        data: null
      };
    }

    const runtimeIds = runtimes.map((item) => item.id);
    const [heartbeat, session, pendingDecisionCount, telegramLink] = await Promise.all([
      this.repo.findLatestHeartbeat(runtime.id),
      this.repo.findLatestSession(runtime.id),
      this.repo.countPendingDecisions(runtimeIds),
      this.repo.findActiveTelegramLink(user.id)
    ]);

    return {
      data: {
        user_ref: userRef,
        runtime_id: runtime.id,
        claw_name: runtime.clawName,
        runtime_status: runtime.status,
        current_sector: session?.currentSector ?? heartbeat?.currentSector ?? "unknown",
        power: heartbeat?.power ?? 0,
        durability: heartbeat?.durability ?? 0,
        credits: heartbeat?.credits ?? 0,
        current_action: heartbeat?.currentAction ?? "idle",
        pending_decision_count: pendingDecisionCount,
        last_seen_at: runtime.lastSeenAt?.toISOString() ?? null,
        telegram_linked: Boolean(telegramLink),
        telegram_link_code: telegramLink?.linkCode ?? null
      }
    };
  }

  async getPendingDecisions(userRef: string) {
    const runtimeIds = await this.getRuntimeIds(userRef);
    const decisions = await this.repo.listPendingDecisions(runtimeIds);

    return {
      data: decisions.map((decision) => ({
        decision_id: decision.id,
        decision_type: decision.decisionType,
        title: decision.title,
        reason: decision.reason,
        risk_level: decision.riskLevel,
        status: decision.status === "waiting_user_response" ? "delivered" : decision.status,
        recommended_option: decision.recommendedOption,
        expires_at: decision.expiresAt.toISOString(),
        handle_in: "telegram" as const
      }))
    };
  }

  async getRuntimeEvents(userRef: string) {
    const runtimeIds = await this.getRuntimeIds(userRef);
    const events = await this.repo.listRuntimeEvents(runtimeIds, 20);

    return {
      data: events.map((event) => {
        const payload = this.asRecord(event.payloadJson);
        return {
          id: event.id,
          occurred_at: event.createdAt.toISOString(),
          event_type: event.eventType,
          severity: event.severity,
          summary:
            this.readString(payload.summary) ??
            this.readString(this.asRecord(payload.result).summary) ??
            event.eventType,
          correlation_id: event.correlationId,
          runtime_id: event.runtimeId
        };
      })
    };
  }

  async getLedgerSummary(userRef: string) {
    const runtimeIds = await this.getRuntimeIds(userRef);
    const entries = await this.repo.listLedgerEntries(runtimeIds, 20);

    const totals = {
      action_reward: 0,
      action_cost: 0,
      trade_settlement: 0,
      frozen_commitment: 0
    };

    for (const entry of entries) {
      if (entry.domain in totals) {
        const key = entry.domain as keyof typeof totals;
        totals[key] += entry.quantity;
      }
    }

    return {
      data: {
        totals,
        recent_entries: entries.map((entry) => ({
          id: entry.id,
          domain: entry.domain,
          entry_type: entry.entryType,
          resource_type: entry.resourceType,
          quantity: entry.quantity,
          created_at: entry.createdAt.toISOString(),
          decision_id: entry.decisionId ?? null
        }))
      }
    };
  }

  private async getRuntimeIds(userRef: string) {
    const user = await this.repo.findUserByExternalRef(userRef);
    if (!user) {
      return [];
    }

    const runtimes = await this.repo.listRuntimesForUser(user.id);
    return runtimes.map((runtime) => runtime.id);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private readString(value: unknown) {
    return typeof value === "string" && value.length > 0 ? value : null;
  }
}
