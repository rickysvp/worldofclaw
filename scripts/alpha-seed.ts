import "dotenv/config";
import { db, dbPool } from "../apps/gateway/src/db/client";
import { env } from "../apps/gateway/src/env";
import { hashRuntimeToken } from "../apps/gateway/src/lib/tokens";
import { WORLD_ID } from "../packages/shared/src/constants";
import {
  commandOutbox,
  decisionActions,
  decisions,
  ledgerEntries,
  runtimeEvents,
  runtimeHeartbeats,
  runtimeSessions,
  runtimes,
  telegramLinks,
  users
} from "../drizzle/schema";

type UserSeed = typeof users.$inferInsert;
type TelegramLinkSeed = typeof telegramLinks.$inferInsert;
type RuntimeSeed = typeof runtimes.$inferInsert;
type SessionSeed = typeof runtimeSessions.$inferInsert;
type HeartbeatSeed = typeof runtimeHeartbeats.$inferInsert;
type RuntimeEventSeed = typeof runtimeEvents.$inferInsert;
type DecisionSeed = typeof decisions.$inferInsert;
type DecisionActionSeed = typeof decisionActions.$inferInsert;
type CommandSeed = typeof commandOutbox.$inferInsert;
type LedgerSeed = typeof ledgerEntries.$inferInsert;

const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000);
const minutesFromNow = (minutes: number) => new Date(now.getTime() + minutes * 60_000);
const authHash = (token: string) => hashRuntimeToken(token, env.RUNTIME_TOKEN_SECRET);

const usersSeed: UserSeed[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    externalRef: "alpha_demo_user",
    displayName: "Alpha Operator",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    externalRef: "alpha_north_runner",
    displayName: "North Runner",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    externalRef: "alpha_signal_keeper",
    displayName: "Signal Keeper",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    externalRef: "alpha_red_dock",
    displayName: "Red Dock",
    createdAt: now,
    updatedAt: now
  }
];

const telegramLinksSeed: TelegramLinkSeed[] = [
  {
    id: "51111111-1111-4111-8111-111111111111",
    userId: "11111111-1111-4111-8111-111111111111",
    telegramChatId: "alpha-demo-chat",
    telegramUserId: "alpha-demo-telegram",
    linkCode: "ALPHA-DEMO-LINK",
    status: "active",
    linkedAt: minutesAgo(30),
    createdAt: now,
    updatedAt: now
  }
];

const runtimesSeed: RuntimeSeed[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    userId: "11111111-1111-4111-8111-111111111111",
    clawName: "Ash Claw",
    runtimeName: "alpha-ash-runtime",
    authTokenHash: authHash("alpha_demo_runtime_token"),
    runtimeVersion: "0.3.0-alpha",
    status: "active",
    lastSeenAt: minutesAgo(1),
    createdAt: now,
    updatedAt: now
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    userId: "22222222-2222-4222-8222-222222222222",
    clawName: "North Pike",
    runtimeName: "alpha-north-runtime",
    authTokenHash: authHash("alpha_north_runtime_token"),
    runtimeVersion: "0.3.0-alpha",
    status: "active",
    lastSeenAt: minutesAgo(3),
    createdAt: now,
    updatedAt: now
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    userId: "33333333-3333-4333-8333-333333333333",
    clawName: "Signal Warden",
    runtimeName: "alpha-signal-runtime",
    authTokenHash: authHash("alpha_signal_runtime_token"),
    runtimeVersion: "0.3.0-alpha",
    status: "stale",
    lastSeenAt: minutesAgo(45),
    createdAt: now,
    updatedAt: now
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    userId: "44444444-4444-4444-8444-444444444444",
    clawName: "Dock Sparrow",
    runtimeName: "alpha-dock-runtime",
    authTokenHash: authHash("alpha_dock_runtime_token"),
    runtimeVersion: "0.3.0-alpha",
    status: "offline",
    lastSeenAt: minutesAgo(180),
    createdAt: now,
    updatedAt: now
  }
];

const sessionsSeed: SessionSeed[] = [
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    sessionStatus: "active",
    worldId: WORLD_ID,
    currentTick: 1442,
    currentSector: "night_wharf",
    startedAt: minutesAgo(120),
    createdAt: now,
    updatedAt: now
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    sessionStatus: "active",
    worldId: WORLD_ID,
    currentTick: 1440,
    currentSector: "glass_ridge",
    startedAt: minutesAgo(90),
    createdAt: now,
    updatedAt: now
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    sessionStatus: "active",
    worldId: WORLD_ID,
    currentTick: 1431,
    currentSector: "dry_spine",
    startedAt: minutesAgo(220),
    createdAt: now,
    updatedAt: now
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    sessionStatus: "ended",
    worldId: WORLD_ID,
    currentTick: 1400,
    currentSector: "red_dock",
    startedAt: minutesAgo(400),
    endedAt: minutesAgo(180),
    createdAt: now,
    updatedAt: now
  }
];

const heartbeatsSeed: HeartbeatSeed[] = [
  {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    power: 91,
    durability: 84,
    credits: 640,
    currentAction: "holding_for_order",
    currentSector: "night_wharf",
    summaryJson: { current_tick: 1442, cargo_used: 2, cargo_max: 6 },
    heartbeatAt: minutesAgo(1),
    createdAt: now
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    power: 88,
    durability: 93,
    credits: 710,
    currentAction: "resource_sweep",
    currentSector: "glass_ridge",
    summaryJson: { current_tick: 1440, cargo_used: 4, cargo_max: 6 },
    heartbeatAt: minutesAgo(3),
    createdAt: now
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
    power: 52,
    durability: 66,
    credits: 420,
    currentAction: "storm_hold",
    currentSector: "dry_spine",
    summaryJson: { current_tick: 1431, cargo_used: 1, cargo_max: 6 },
    heartbeatAt: minutesAgo(45),
    createdAt: now
  }
];

const runtimeEventsSeed: RuntimeEventSeed[] = [
  {
    id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd1",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    eventType: "trade.alert",
    severity: "high",
    correlationId: "alpha-feed-001",
    payloadJson: {
      title: "High-risk trade decision pending",
      summary: "Ash Claw flagged a xenite trade above threshold and is waiting for Telegram review."
    },
    createdAt: minutesAgo(2)
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    eventType: "salvage.completed",
    severity: "low",
    correlationId: "alpha-feed-002",
    payloadJson: {
      title: "North Pike secured salvage haul",
      summary: "Resource sweep completed with clean recovery and stable power burn."
    },
    createdAt: minutesAgo(6)
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd3",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
    eventType: "weather.warning",
    severity: "medium",
    correlationId: "alpha-feed-003",
    payloadJson: {
      title: "Dry Spine storm cell intensifying",
      summary: "Signal Warden remains in hold pattern after long heartbeat silence."
    },
    createdAt: minutesAgo(20)
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd4",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    eventType: "patrol.scan",
    severity: "low",
    correlationId: "alpha-feed-004",
    payloadJson: {
      title: "Night Wharf perimeter rescan",
      summary: "Ash Claw confirmed route integrity while awaiting user decision."
    },
    createdAt: minutesAgo(9)
  }
];

const decisionsSeed: DecisionSeed[] = [
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    decisionType: "high_value_trade",
    title: "Night Wharf xenite trade",
    reason: "Counterparty requests a high-risk xenite purchase above the local auto-trade threshold.",
    riskLevel: "high",
    status: "waiting_user_response",
    recommendedOption: "reject",
    optionsJson: [
      { id: "approve", label: "Approve trade" },
      { id: "reject", label: "Reject trade" }
    ],
    snapshotJson: {
      world_tick: 1442,
      trade: {
        counterparty: "night_wharf_market",
        estimated_spend: 520
      }
    },
    expiresAt: minutesFromNow(45),
    correlationId: "alpha-seed-decision-001",
    createdAt: minutesAgo(5),
    updatedAt: now
  }
];

const decisionActionsSeed: DecisionActionSeed[] = [
  {
    id: "f1111111-1111-4111-8111-111111111111",
    decisionId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
    actorType: "system",
    actorRef: "decision_service",
    actionType: "system_created",
    payloadJson: {
      runtime_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      session_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1"
    },
    createdAt: minutesAgo(5)
  },
  {
    id: "f2222222-2222-4222-8222-222222222222",
    decisionId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
    actorType: "system",
    actorRef: "telegram_sender",
    actionType: "telegram_sent",
    payloadJson: {
      telegram_chat_id: "alpha-demo-chat"
    },
    createdAt: minutesAgo(4)
  }
];

const commandOutboxSeed: CommandSeed[] = [
  {
    id: "12121212-1212-4212-8212-121212121212",
    runtimeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    decisionId: null,
    commandType: "status_refresh",
    payloadJson: {
      correlation_id: "alpha-command-001",
      requested_by: "alpha_seed"
    },
    status: "queued",
    queuedAt: minutesAgo(8),
    createdAt: minutesAgo(8),
    updatedAt: now
  }
];

const ledgerEntriesSeed: LedgerSeed[] = [
  {
    id: "13131313-1313-4313-8313-131313131313",
    domain: "action_reward",
    entryType: "credit",
    ownerType: "runtime",
    ownerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    counterpartyType: null,
    counterpartyId: null,
    resourceType: "intel",
    quantity: 3,
    unit: "unit",
    sourceType: "event",
    sourceId: "alpha-reward-001",
    causedByAction: "salvage_scan",
    causedByEvent: "salvage_scan.result",
    decisionId: null,
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    worldTick: 1440,
    status: "finalized",
    metadataJson: { correlation_id: "alpha-reward-001" },
    createdAt: minutesAgo(12),
    finalizedAt: minutesAgo(12)
  },
  {
    id: "14141414-1414-4414-8414-141414141414",
    domain: "action_cost",
    entryType: "debit",
    ownerType: "runtime",
    ownerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    counterpartyType: null,
    counterpartyId: null,
    resourceType: "power",
    quantity: 5,
    unit: "unit",
    sourceType: "event",
    sourceId: "alpha-cost-001",
    causedByAction: "route_probe",
    causedByEvent: "route_probe.result",
    decisionId: null,
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    worldTick: 1441,
    status: "finalized",
    metadataJson: { correlation_id: "alpha-cost-001" },
    createdAt: minutesAgo(10),
    finalizedAt: minutesAgo(10)
  },
  {
    id: "15151515-1515-4515-8515-151515151515",
    domain: "frozen_commitment",
    entryType: "freeze",
    ownerType: "runtime",
    ownerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    counterpartyType: "market",
    counterpartyId: "night_wharf_market",
    resourceType: "credits",
    quantity: 520,
    unit: "cc",
    sourceType: "decision",
    sourceId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
    causedByAction: "high_value_trade",
    causedByEvent: "decision.created",
    decisionId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
    sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    worldTick: 1442,
    status: "frozen",
    metadataJson: { note: "alpha placeholder commitment" },
    createdAt: minutesAgo(5),
    finalizedAt: null
  }
];

const main = async () => {
  await db.transaction(async (tx) => {
    for (const row of usersSeed) {
      await tx.insert(users).values(row).onConflictDoUpdate({
        target: users.id,
        set: {
          externalRef: row.externalRef,
          displayName: row.displayName,
          updatedAt: now
        }
      });
    }

    for (const row of telegramLinksSeed) {
      await tx.insert(telegramLinks).values(row).onConflictDoUpdate({
        target: telegramLinks.id,
        set: {
          telegramChatId: row.telegramChatId,
          telegramUserId: row.telegramUserId,
          linkCode: row.linkCode,
          status: row.status,
          linkedAt: row.linkedAt ?? null,
          updatedAt: now
        }
      });
    }

    for (const row of runtimesSeed) {
      await tx.insert(runtimes).values(row).onConflictDoUpdate({
        target: runtimes.id,
        set: {
          userId: row.userId,
          clawName: row.clawName,
          runtimeName: row.runtimeName,
          authTokenHash: row.authTokenHash,
          runtimeVersion: row.runtimeVersion,
          status: row.status,
          lastSeenAt: row.lastSeenAt ?? null,
          updatedAt: now
        }
      });
    }

    for (const row of sessionsSeed) {
      await tx.insert(runtimeSessions).values(row).onConflictDoUpdate({
        target: runtimeSessions.id,
        set: {
          runtimeId: row.runtimeId,
          sessionStatus: row.sessionStatus,
          worldId: row.worldId,
          currentTick: row.currentTick,
          currentSector: row.currentSector,
          startedAt: row.startedAt,
          endedAt: row.endedAt ?? null,
          updatedAt: now
        }
      });
    }

    for (const row of heartbeatsSeed) {
      await tx.insert(runtimeHeartbeats).values(row).onConflictDoUpdate({
        target: runtimeHeartbeats.id,
        set: {
          runtimeId: row.runtimeId,
          sessionId: row.sessionId,
          power: row.power,
          durability: row.durability,
          credits: row.credits,
          currentAction: row.currentAction,
          currentSector: row.currentSector,
          summaryJson: row.summaryJson,
          heartbeatAt: row.heartbeatAt
        }
      });
    }

    for (const row of runtimeEventsSeed) {
      await tx.insert(runtimeEvents).values(row).onConflictDoUpdate({
        target: runtimeEvents.id,
        set: {
          runtimeId: row.runtimeId,
          sessionId: row.sessionId,
          eventType: row.eventType,
          severity: row.severity,
          correlationId: row.correlationId,
          payloadJson: row.payloadJson
        }
      });
    }

    for (const row of decisionsSeed) {
      await tx.insert(decisions).values(row).onConflictDoUpdate({
        target: decisions.id,
        set: {
          runtimeId: row.runtimeId,
          sessionId: row.sessionId,
          decisionType: row.decisionType,
          title: row.title,
          reason: row.reason,
          riskLevel: row.riskLevel,
          status: row.status,
          recommendedOption: row.recommendedOption,
          optionsJson: row.optionsJson,
          snapshotJson: row.snapshotJson,
          expiresAt: row.expiresAt,
          correlationId: row.correlationId,
          resolvedAt: row.resolvedAt ?? null,
          updatedAt: now
        }
      });
    }

    for (const row of decisionActionsSeed) {
      await tx.insert(decisionActions).values(row).onConflictDoUpdate({
        target: decisionActions.id,
        set: {
          decisionId: row.decisionId,
          actorType: row.actorType,
          actorRef: row.actorRef,
          actionType: row.actionType,
          payloadJson: row.payloadJson
        }
      });
    }

    for (const row of commandOutboxSeed) {
      await tx.insert(commandOutbox).values(row).onConflictDoUpdate({
        target: commandOutbox.id,
        set: {
          runtimeId: row.runtimeId,
          decisionId: row.decisionId ?? null,
          commandType: row.commandType,
          payloadJson: row.payloadJson,
          status: row.status,
          queuedAt: row.queuedAt,
          deliveredAt: row.deliveredAt ?? null,
          acknowledgedAt: row.acknowledgedAt ?? null,
          updatedAt: now
        }
      });
    }

    for (const row of ledgerEntriesSeed) {
      await tx.insert(ledgerEntries).values(row).onConflictDoUpdate({
        target: ledgerEntries.id,
        set: {
          domain: row.domain,
          entryType: row.entryType,
          ownerType: row.ownerType,
          ownerId: row.ownerId,
          counterpartyType: row.counterpartyType ?? null,
          counterpartyId: row.counterpartyId ?? null,
          resourceType: row.resourceType,
          quantity: row.quantity,
          unit: row.unit,
          sourceType: row.sourceType,
          sourceId: row.sourceId,
          causedByAction: row.causedByAction ?? null,
          causedByEvent: row.causedByEvent ?? null,
          decisionId: row.decisionId ?? null,
          sessionId: row.sessionId ?? null,
          worldTick: row.worldTick,
          status: row.status,
          metadataJson: row.metadataJson,
          finalizedAt: row.finalizedAt ?? null
        }
      });
    }
  });

  console.log("alpha seed complete");
  console.log(
    JSON.stringify(
      {
        users: usersSeed.length,
        runtimes: runtimesSeed.length,
        feed_events: runtimeEventsSeed.length,
        pending_decisions: decisionsSeed.filter((decision) => decision.status === "waiting_user_response").length,
        ledger_entries: ledgerEntriesSeed.length,
        demo_user_ref: "alpha_demo_user"
      },
      null,
      2
    )
  );
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
