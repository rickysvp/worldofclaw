CREATE TYPE "public"."command_outbox_status" AS ENUM('queued', 'delivered', 'acknowledged', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."decision_action_actor_type" AS ENUM('system', 'user', 'runtime', 'telegram');--> statement-breakpoint
CREATE TYPE "public"."decision_action_type" AS ENUM('system_created', 'telegram_sent', 'approved', 'rejected', 'modified', 'expired');--> statement-breakpoint
CREATE TYPE "public"."decision_risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."decision_status" AS ENUM('pending', 'waiting_user_response', 'approved', 'rejected', 'modified', 'expired');--> statement-breakpoint
CREATE TYPE "public"."idempotency_status" AS ENUM('started', 'completed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_status" AS ENUM('pending', 'frozen', 'finalized', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."runtime_event_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."runtime_session_status" AS ENUM('pending', 'active', 'ended');--> statement-breakpoint
CREATE TYPE "public"."runtime_status" AS ENUM('active', 'pending', 'suspended', 'offline');--> statement-breakpoint
CREATE TYPE "public"."telegram_link_status" AS ENUM('pending', 'active', 'revoked');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" varchar(128) NOT NULL,
	"actor_ref" varchar(255) NOT NULL,
	"action" varchar(128) NOT NULL,
	"target_type" varchar(128) NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"correlation_id" varchar(255),
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"runtime_id" uuid NOT NULL,
	"decision_id" uuid,
	"command_type" varchar(128) NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "command_outbox_status" DEFAULT 'queued' NOT NULL,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"actor_type" "decision_action_actor_type" NOT NULL,
	"actor_ref" varchar(255) NOT NULL,
	"action_type" "decision_action_type" NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"runtime_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"decision_type" varchar(128) NOT NULL,
	"title" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"risk_level" "decision_risk_level" NOT NULL,
	"status" "decision_status" DEFAULT 'pending' NOT NULL,
	"recommended_option" varchar(128) NOT NULL,
	"options_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"snapshot_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"correlation_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idem_key" varchar(255) NOT NULL,
	"scope" varchar(128) NOT NULL,
	"status" "idempotency_status" DEFAULT 'started' NOT NULL,
	"request_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" varchar(128) NOT NULL,
	"entry_type" varchar(128) NOT NULL,
	"owner_type" varchar(128) NOT NULL,
	"owner_id" varchar(255) NOT NULL,
	"counterparty_type" varchar(128),
	"counterparty_id" varchar(255),
	"resource_type" varchar(128) NOT NULL,
	"quantity" bigint NOT NULL,
	"unit" varchar(32) NOT NULL,
	"source_type" varchar(128) NOT NULL,
	"source_id" varchar(255) NOT NULL,
	"caused_by_action" varchar(128),
	"caused_by_event" varchar(128),
	"decision_id" uuid,
	"session_id" uuid,
	"world_tick" bigint DEFAULT 0 NOT NULL,
	"status" "ledger_entry_status" DEFAULT 'pending' NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "runtime_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"runtime_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"event_type" varchar(128) NOT NULL,
	"severity" "runtime_event_severity" DEFAULT 'low' NOT NULL,
	"correlation_id" varchar(255) NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runtime_heartbeats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"runtime_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"power" integer DEFAULT 0 NOT NULL,
	"durability" integer DEFAULT 0 NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"current_action" varchar(255) DEFAULT 'idle' NOT NULL,
	"current_sector" varchar(255) DEFAULT 'unknown' NOT NULL,
	"summary_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runtime_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"runtime_id" uuid NOT NULL,
	"session_status" "runtime_session_status" DEFAULT 'pending' NOT NULL,
	"world_id" varchar(128) NOT NULL,
	"current_tick" bigint DEFAULT 0 NOT NULL,
	"current_sector" varchar(255) DEFAULT 'unknown' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runtimes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"claw_name" varchar(255) NOT NULL,
	"runtime_name" varchar(255) NOT NULL,
	"auth_token_hash" varchar(255) NOT NULL,
	"runtime_version" varchar(64) NOT NULL,
	"status" "runtime_status" DEFAULT 'active' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"telegram_chat_id" varchar(255) NOT NULL,
	"telegram_user_id" varchar(255) NOT NULL,
	"link_code" varchar(255) NOT NULL,
	"status" "telegram_link_status" DEFAULT 'pending' NOT NULL,
	"linked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_ref" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_external_ref_unique" UNIQUE("external_ref")
);
--> statement-breakpoint
ALTER TABLE "command_outbox" ADD CONSTRAINT "command_outbox_runtime_id_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."runtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "command_outbox" ADD CONSTRAINT "command_outbox_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_actions" ADD CONSTRAINT "decision_actions_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_runtime_id_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."runtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_session_id_runtime_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."runtime_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_session_id_runtime_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."runtime_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_events" ADD CONSTRAINT "runtime_events_runtime_id_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."runtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_events" ADD CONSTRAINT "runtime_events_session_id_runtime_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."runtime_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_heartbeats" ADD CONSTRAINT "runtime_heartbeats_runtime_id_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."runtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_heartbeats" ADD CONSTRAINT "runtime_heartbeats_session_id_runtime_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."runtime_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_sessions" ADD CONSTRAINT "runtime_sessions_runtime_id_runtimes_id_fk" FOREIGN KEY ("runtime_id") REFERENCES "public"."runtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtimes" ADD CONSTRAINT "runtimes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_links" ADD CONSTRAINT "telegram_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_type","actor_ref");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_logs_correlation_idx" ON "audit_logs" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "command_outbox_runtime_id_idx" ON "command_outbox" USING btree ("runtime_id");--> statement-breakpoint
CREATE INDEX "command_outbox_decision_id_idx" ON "command_outbox" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "command_outbox_status_idx" ON "command_outbox" USING btree ("status");--> statement-breakpoint
CREATE INDEX "decision_actions_decision_id_idx" ON "decision_actions" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "decision_actions_action_type_idx" ON "decision_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "decisions_runtime_id_idx" ON "decisions" USING btree ("runtime_id");--> statement-breakpoint
CREATE INDEX "decisions_session_id_idx" ON "decisions" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "decisions_correlation_idx" ON "decisions" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "decisions_status_idx" ON "decisions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_scope_key_idx" ON "idempotency_keys" USING btree ("scope","idem_key");--> statement-breakpoint
CREATE INDEX "ledger_entries_owner_idx" ON "ledger_entries" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_decision_idx" ON "ledger_entries" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_session_idx" ON "ledger_entries" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_world_tick_idx" ON "ledger_entries" USING btree ("world_tick");--> statement-breakpoint
CREATE INDEX "runtime_events_runtime_id_idx" ON "runtime_events" USING btree ("runtime_id");--> statement-breakpoint
CREATE INDEX "runtime_events_session_id_idx" ON "runtime_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "runtime_events_correlation_idx" ON "runtime_events" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "runtime_heartbeats_runtime_id_idx" ON "runtime_heartbeats" USING btree ("runtime_id");--> statement-breakpoint
CREATE INDEX "runtime_heartbeats_session_id_idx" ON "runtime_heartbeats" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "runtime_heartbeats_heartbeat_at_idx" ON "runtime_heartbeats" USING btree ("heartbeat_at");--> statement-breakpoint
CREATE INDEX "runtime_sessions_runtime_id_idx" ON "runtime_sessions" USING btree ("runtime_id");--> statement-breakpoint
CREATE INDEX "runtime_sessions_status_idx" ON "runtime_sessions" USING btree ("session_status");--> statement-breakpoint
CREATE INDEX "runtimes_user_id_idx" ON "runtimes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "runtimes_auth_token_hash_idx" ON "runtimes" USING btree ("auth_token_hash");--> statement-breakpoint
CREATE INDEX "runtimes_status_idx" ON "runtimes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "telegram_links_user_id_idx" ON "telegram_links" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_links_chat_id_idx" ON "telegram_links" USING btree ("telegram_chat_id");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_links_link_code_idx" ON "telegram_links" USING btree ("link_code");--> statement-breakpoint
CREATE UNIQUE INDEX "users_external_ref_idx" ON "users" USING btree ("external_ref");