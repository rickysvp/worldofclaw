CREATE TYPE telegram_link_status AS ENUM ('pending', 'active', 'revoked');
CREATE TYPE runtime_status AS ENUM ('active', 'pending', 'suspended', 'offline');
CREATE TYPE runtime_session_status AS ENUM ('pending', 'active', 'ended');
CREATE TYPE runtime_event_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE decision_risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE decision_status AS ENUM ('pending', 'waiting_user_response', 'approved', 'rejected', 'modified', 'expired');
CREATE TYPE decision_action_actor_type AS ENUM ('system', 'user', 'runtime', 'telegram');
CREATE TYPE decision_action_type AS ENUM ('system_created', 'telegram_sent', 'approved', 'rejected', 'modified', 'expired');
CREATE TYPE command_outbox_status AS ENUM ('queued', 'delivered', 'acknowledged', 'expired', 'failed');
CREATE TYPE ledger_entry_status AS ENUM ('pending', 'frozen', 'finalized', 'reversed');
CREATE TYPE idempotency_status AS ENUM ('started', 'completed', 'expired');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref varchar(255) NOT NULL UNIQUE,
  display_name varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE telegram_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_chat_id varchar(255) NOT NULL,
  telegram_user_id varchar(255) NOT NULL,
  link_code varchar(255) NOT NULL,
  status telegram_link_status NOT NULL DEFAULT 'pending',
  linked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX telegram_links_chat_id_idx ON telegram_links (telegram_chat_id);
CREATE UNIQUE INDEX telegram_links_link_code_idx ON telegram_links (link_code);
CREATE INDEX telegram_links_user_id_idx ON telegram_links (user_id);

CREATE TABLE runtimes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claw_name varchar(255) NOT NULL,
  runtime_name varchar(255) NOT NULL,
  auth_token_hash varchar(255) NOT NULL,
  runtime_version varchar(64) NOT NULL,
  status runtime_status NOT NULL DEFAULT 'active',
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX runtimes_auth_token_hash_idx ON runtimes (auth_token_hash);
CREATE INDEX runtimes_user_id_idx ON runtimes (user_id);
CREATE INDEX runtimes_status_idx ON runtimes (status);

CREATE TABLE runtime_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runtime_id uuid NOT NULL REFERENCES runtimes(id) ON DELETE CASCADE,
  session_status runtime_session_status NOT NULL DEFAULT 'pending',
  world_id varchar(128) NOT NULL,
  current_tick bigint NOT NULL DEFAULT 0,
  current_sector varchar(255) NOT NULL DEFAULT 'unknown',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX runtime_sessions_runtime_id_idx ON runtime_sessions (runtime_id);
CREATE INDEX runtime_sessions_status_idx ON runtime_sessions (session_status);

CREATE TABLE runtime_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runtime_id uuid NOT NULL REFERENCES runtimes(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES runtime_sessions(id) ON DELETE CASCADE,
  power integer NOT NULL DEFAULT 0,
  durability integer NOT NULL DEFAULT 0,
  credits integer NOT NULL DEFAULT 0,
  current_action varchar(255) NOT NULL DEFAULT 'idle',
  current_sector varchar(255) NOT NULL DEFAULT 'unknown',
  summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  heartbeat_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX runtime_heartbeats_runtime_id_idx ON runtime_heartbeats (runtime_id);
CREATE INDEX runtime_heartbeats_session_id_idx ON runtime_heartbeats (session_id);
CREATE INDEX runtime_heartbeats_heartbeat_at_idx ON runtime_heartbeats (heartbeat_at);

CREATE TABLE runtime_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runtime_id uuid NOT NULL REFERENCES runtimes(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES runtime_sessions(id) ON DELETE CASCADE,
  event_type varchar(128) NOT NULL,
  severity runtime_event_severity NOT NULL DEFAULT 'low',
  correlation_id varchar(255) NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX runtime_events_runtime_id_idx ON runtime_events (runtime_id);
CREATE INDEX runtime_events_session_id_idx ON runtime_events (session_id);
CREATE INDEX runtime_events_correlation_idx ON runtime_events (correlation_id);

CREATE TABLE decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runtime_id uuid NOT NULL REFERENCES runtimes(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES runtime_sessions(id) ON DELETE CASCADE,
  decision_type varchar(128) NOT NULL,
  title varchar(255) NOT NULL,
  reason text NOT NULL,
  risk_level decision_risk_level NOT NULL,
  status decision_status NOT NULL DEFAULT 'pending',
  recommended_option varchar(128) NOT NULL,
  options_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  correlation_id varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX decisions_correlation_idx ON decisions (correlation_id);
CREATE INDEX decisions_runtime_id_idx ON decisions (runtime_id);
CREATE INDEX decisions_session_id_idx ON decisions (session_id);
CREATE INDEX decisions_status_idx ON decisions (status);

CREATE TABLE decision_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  actor_type decision_action_actor_type NOT NULL,
  actor_ref varchar(255) NOT NULL,
  action_type decision_action_type NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX decision_actions_decision_id_idx ON decision_actions (decision_id);
CREATE INDEX decision_actions_action_type_idx ON decision_actions (action_type);

CREATE TABLE command_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runtime_id uuid NOT NULL REFERENCES runtimes(id) ON DELETE CASCADE,
  decision_id uuid REFERENCES decisions(id) ON DELETE SET NULL,
  command_type varchar(128) NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status command_outbox_status NOT NULL DEFAULT 'queued',
  queued_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX command_outbox_runtime_id_idx ON command_outbox (runtime_id);
CREATE INDEX command_outbox_decision_id_idx ON command_outbox (decision_id);
CREATE INDEX command_outbox_status_idx ON command_outbox (status);

CREATE TABLE ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain varchar(128) NOT NULL,
  entry_type varchar(128) NOT NULL,
  owner_type varchar(128) NOT NULL,
  owner_id varchar(255) NOT NULL,
  counterparty_type varchar(128),
  counterparty_id varchar(255),
  resource_type varchar(128) NOT NULL,
  quantity bigint NOT NULL,
  unit varchar(32) NOT NULL,
  source_type varchar(128) NOT NULL,
  source_id varchar(255) NOT NULL,
  caused_by_action varchar(128),
  caused_by_event varchar(128),
  decision_id uuid REFERENCES decisions(id) ON DELETE SET NULL,
  session_id uuid REFERENCES runtime_sessions(id) ON DELETE SET NULL,
  world_tick bigint NOT NULL DEFAULT 0,
  status ledger_entry_status NOT NULL DEFAULT 'pending',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz
);
CREATE INDEX ledger_entries_owner_idx ON ledger_entries (owner_type, owner_id);
CREATE INDEX ledger_entries_decision_idx ON ledger_entries (decision_id);
CREATE INDEX ledger_entries_session_idx ON ledger_entries (session_id);
CREATE INDEX ledger_entries_world_tick_idx ON ledger_entries (world_tick);

CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idem_key varchar(255) NOT NULL,
  scope varchar(128) NOT NULL,
  status idempotency_status NOT NULL DEFAULT 'started',
  request_hash varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX idempotency_scope_key_idx ON idempotency_keys (scope, idem_key);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type varchar(128) NOT NULL,
  actor_ref varchar(255) NOT NULL,
  action varchar(128) NOT NULL,
  target_type varchar(128) NOT NULL,
  target_id varchar(255) NOT NULL,
  correlation_id varchar(255),
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_type, actor_ref);
CREATE INDEX audit_logs_target_idx ON audit_logs (target_type, target_id);
CREATE INDEX audit_logs_correlation_idx ON audit_logs (correlation_id);
