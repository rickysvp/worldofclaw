import type { BridgeAlert, BridgeCapabilities, BridgeSessionStatus } from "../protocol.types";

export type BridgeSessionRecord = {
  session_id: string;
  registration_id: string;
  skill_name: string;
  user_id: string;
  agent_id: string;
  status: BridgeSessionStatus;
  capabilities: BridgeCapabilities;
  claim_token_id: string;
  world_access_token_id: string;
  created_at_seconds: number;
  expires_at_seconds: number;
  last_heartbeat_at_seconds: number | null;
  tick_seen: number;
  local_digest: string;
  alerts: BridgeAlert[];
  acked_event_ids: string[];
  queued_action_ids: string[];
};
