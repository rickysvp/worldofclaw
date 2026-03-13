import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const telegramLinkStatusEnum = pgEnum("telegram_link_status", ["pending", "active", "revoked"]);
export const runtimeStatusEnum = pgEnum("runtime_status", ["registered", "active", "stale", "offline", "pending", "suspended"]);
export const runtimeSessionStatusEnum = pgEnum("runtime_session_status", ["pending", "active", "ended"]);
export const runtimeEventSeverityEnum = pgEnum("runtime_event_severity", ["low", "medium", "high", "critical"]);
export const decisionRiskLevelEnum = pgEnum("decision_risk_level", ["low", "medium", "high"]);
export const decisionStatusEnum = pgEnum("decision_status", [
  "pending",
  "waiting_user_response",
  "approved",
  "rejected",
  "modified",
  "expired",
  "resolved"
]);
export const decisionActionActorTypeEnum = pgEnum("decision_action_actor_type", ["system", "user", "runtime", "telegram"]);
export const decisionActionTypeEnum = pgEnum("decision_action_type", [
  "system_created",
  "telegram_sent",
  "approved",
  "rejected",
  "modified",
  "expired"
]);
export const commandOutboxStatusEnum = pgEnum("command_outbox_status", ["queued", "delivered", "acknowledged", "expired", "failed"]);
export const ledgerEntryStatusEnum = pgEnum("ledger_entry_status", ["pending", "frozen", "finalized", "reversed"]);
export const idempotencyStatusEnum = pgEnum("idempotency_status", ["started", "completed", "expired"]);

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalRef: varchar("external_ref", { length: 255 }).notNull().unique(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    createdAt,
    updatedAt
  },
  (table) => ({
    externalRefIdx: uniqueIndex("users_external_ref_idx").on(table.externalRef)
  })
);

export const telegramLinks = pgTable(
  "telegram_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    telegramChatId: varchar("telegram_chat_id", { length: 255 }).notNull(),
    telegramUserId: varchar("telegram_user_id", { length: 255 }).notNull(),
    linkCode: varchar("link_code", { length: 255 }).notNull(),
    status: telegramLinkStatusEnum("status").notNull().default("pending"),
    linkedAt: timestamp("linked_at", { withTimezone: true }),
    createdAt,
    updatedAt
  },
  (table) => ({
    userIdIdx: index("telegram_links_user_id_idx").on(table.userId),
    chatIdIdx: uniqueIndex("telegram_links_chat_id_idx").on(table.telegramChatId),
    linkCodeIdx: uniqueIndex("telegram_links_link_code_idx").on(table.linkCode)
  })
);

export const runtimes = pgTable(
  "runtimes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    clawName: varchar("claw_name", { length: 255 }).notNull(),
    runtimeName: varchar("runtime_name", { length: 255 }).notNull(),
    authTokenHash: varchar("auth_token_hash", { length: 255 }).notNull(),
    runtimeVersion: varchar("runtime_version", { length: 64 }).notNull(),
    status: runtimeStatusEnum("status").notNull().default("registered"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt,
    updatedAt
  },
  (table) => ({
    userIdIdx: index("runtimes_user_id_idx").on(table.userId),
    authTokenHashIdx: uniqueIndex("runtimes_auth_token_hash_idx").on(table.authTokenHash),
    statusIdx: index("runtimes_status_idx").on(table.status)
  })
);

export const runtimeSessions = pgTable(
  "runtime_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runtimeId: uuid("runtime_id").notNull().references(() => runtimes.id, { onDelete: "cascade" }),
    sessionStatus: runtimeSessionStatusEnum("session_status").notNull().default("pending"),
    worldId: varchar("world_id", { length: 128 }).notNull(),
    currentTick: bigint("current_tick", { mode: "number" }).notNull().default(0),
    currentSector: varchar("current_sector", { length: 255 }).notNull().default("unknown"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt,
    updatedAt
  },
  (table) => ({
    runtimeIdIdx: index("runtime_sessions_runtime_id_idx").on(table.runtimeId),
    sessionStatusIdx: index("runtime_sessions_status_idx").on(table.sessionStatus)
  })
);

export const runtimeHeartbeats = pgTable(
  "runtime_heartbeats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runtimeId: uuid("runtime_id").notNull().references(() => runtimes.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").notNull().references(() => runtimeSessions.id, { onDelete: "cascade" }),
    power: integer("power").notNull().default(0),
    durability: integer("durability").notNull().default(0),
    credits: integer("credits").notNull().default(0),
    currentAction: varchar("current_action", { length: 255 }).notNull().default("idle"),
    currentSector: varchar("current_sector", { length: 255 }).notNull().default("unknown"),
    summaryJson: jsonb("summary_json").notNull().default({}),
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt
  },
  (table) => ({
    runtimeIdIdx: index("runtime_heartbeats_runtime_id_idx").on(table.runtimeId),
    sessionIdIdx: index("runtime_heartbeats_session_id_idx").on(table.sessionId),
    heartbeatAtIdx: index("runtime_heartbeats_heartbeat_at_idx").on(table.heartbeatAt)
  })
);

export const runtimeEvents = pgTable(
  "runtime_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runtimeId: uuid("runtime_id").notNull().references(() => runtimes.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").notNull().references(() => runtimeSessions.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    severity: runtimeEventSeverityEnum("severity").notNull().default("low"),
    correlationId: varchar("correlation_id", { length: 255 }).notNull(),
    payloadJson: jsonb("payload_json").notNull().default({}),
    createdAt
  },
  (table) => ({
    runtimeIdIdx: index("runtime_events_runtime_id_idx").on(table.runtimeId),
    sessionIdIdx: index("runtime_events_session_id_idx").on(table.sessionId),
    correlationIdx: index("runtime_events_correlation_idx").on(table.correlationId)
  })
);

export const decisions = pgTable(
  "decisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runtimeId: uuid("runtime_id").notNull().references(() => runtimes.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").notNull().references(() => runtimeSessions.id, { onDelete: "cascade" }),
    decisionType: varchar("decision_type", { length: 128 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    reason: text("reason").notNull(),
    riskLevel: decisionRiskLevelEnum("risk_level").notNull(),
    status: decisionStatusEnum("status").notNull().default("pending"),
    recommendedOption: varchar("recommended_option", { length: 128 }).notNull(),
    optionsJson: jsonb("options_json").notNull().default([]),
    snapshotJson: jsonb("snapshot_json").notNull().default({}),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    correlationId: varchar("correlation_id", { length: 255 }).notNull(),
    createdAt,
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    updatedAt
  },
  (table) => ({
    runtimeIdIdx: index("decisions_runtime_id_idx").on(table.runtimeId),
    sessionIdIdx: index("decisions_session_id_idx").on(table.sessionId),
    correlationIdx: uniqueIndex("decisions_correlation_idx").on(table.correlationId),
    statusIdx: index("decisions_status_idx").on(table.status)
  })
);

export const decisionActions = pgTable(
  "decision_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    decisionId: uuid("decision_id").notNull().references(() => decisions.id, { onDelete: "cascade" }),
    actorType: decisionActionActorTypeEnum("actor_type").notNull(),
    actorRef: varchar("actor_ref", { length: 255 }).notNull(),
    actionType: decisionActionTypeEnum("action_type").notNull(),
    payloadJson: jsonb("payload_json").notNull().default({}),
    createdAt
  },
  (table) => ({
    decisionIdIdx: index("decision_actions_decision_id_idx").on(table.decisionId),
    actionTypeIdx: index("decision_actions_action_type_idx").on(table.actionType)
  })
);

export const commandOutbox = pgTable(
  "command_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runtimeId: uuid("runtime_id").notNull().references(() => runtimes.id, { onDelete: "cascade" }),
    decisionId: uuid("decision_id").references(() => decisions.id, { onDelete: "set null" }),
    commandType: varchar("command_type", { length: 128 }).notNull(),
    payloadJson: jsonb("payload_json").notNull().default({}),
    status: commandOutboxStatusEnum("status").notNull().default("queued"),
    queuedAt: timestamp("queued_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    createdAt,
    updatedAt
  },
  (table) => ({
    runtimeIdIdx: index("command_outbox_runtime_id_idx").on(table.runtimeId),
    decisionIdIdx: index("command_outbox_decision_id_idx").on(table.decisionId),
    statusIdx: index("command_outbox_status_idx").on(table.status)
  })
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domain: varchar("domain", { length: 128 }).notNull(),
    entryType: varchar("entry_type", { length: 128 }).notNull(),
    ownerType: varchar("owner_type", { length: 128 }).notNull(),
    ownerId: varchar("owner_id", { length: 255 }).notNull(),
    counterpartyType: varchar("counterparty_type", { length: 128 }),
    counterpartyId: varchar("counterparty_id", { length: 255 }),
    resourceType: varchar("resource_type", { length: 128 }).notNull(),
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    unit: varchar("unit", { length: 32 }).notNull(),
    sourceType: varchar("source_type", { length: 128 }).notNull(),
    sourceId: varchar("source_id", { length: 255 }).notNull(),
    causedByAction: varchar("caused_by_action", { length: 128 }),
    causedByEvent: varchar("caused_by_event", { length: 128 }),
    decisionId: uuid("decision_id").references(() => decisions.id, { onDelete: "set null" }),
    sessionId: uuid("session_id").references(() => runtimeSessions.id, { onDelete: "set null" }),
    worldTick: bigint("world_tick", { mode: "number" }).notNull().default(0),
    status: ledgerEntryStatusEnum("status").notNull().default("pending"),
    metadataJson: jsonb("metadata_json").notNull().default({}),
    createdAt,
    finalizedAt: timestamp("finalized_at", { withTimezone: true })
  },
  (table) => ({
    ownerIdx: index("ledger_entries_owner_idx").on(table.ownerType, table.ownerId),
    decisionIdx: index("ledger_entries_decision_idx").on(table.decisionId),
    sessionIdx: index("ledger_entries_session_idx").on(table.sessionId),
    worldTickIdx: index("ledger_entries_world_tick_idx").on(table.worldTick)
  })
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    idemKey: varchar("idem_key", { length: 255 }).notNull(),
    scope: varchar("scope", { length: 128 }).notNull(),
    status: idempotencyStatusEnum("status").notNull().default("started"),
    requestHash: varchar("request_hash", { length: 255 }).notNull(),
    createdAt,
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
  },
  (table) => ({
    idemScopeIdx: uniqueIndex("idempotency_scope_key_idx").on(table.scope, table.idemKey)
  })
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorType: varchar("actor_type", { length: 128 }).notNull(),
    actorRef: varchar("actor_ref", { length: 255 }).notNull(),
    action: varchar("action", { length: 128 }).notNull(),
    targetType: varchar("target_type", { length: 128 }).notNull(),
    targetId: varchar("target_id", { length: 255 }).notNull(),
    correlationId: varchar("correlation_id", { length: 255 }),
    payloadJson: jsonb("payload_json").notNull().default({}),
    createdAt
  },
  (table) => ({
    actorIdx: index("audit_logs_actor_idx").on(table.actorType, table.actorRef),
    targetIdx: index("audit_logs_target_idx").on(table.targetType, table.targetId),
    correlationIdx: index("audit_logs_correlation_idx").on(table.correlationId)
  })
);
