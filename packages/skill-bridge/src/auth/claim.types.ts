import type { BridgeCapabilities } from "../protocol.types";

export type SkillRegistrationRecord = {
  registration_id: string;
  skill_name: string;
  user_id: string;
  agent_id: string;
  skill_version: string;
  local_digest: string;
  requested_capabilities: BridgeCapabilities;
  created_at_seconds: number;
  claim_token_id: string;
  last_idempotency_key: string;
};
