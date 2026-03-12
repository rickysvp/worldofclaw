export type ClaimTokenRecord = {
  token_id: string;
  claim_token: string;
  registration_id: string;
  agent_id: string;
  user_id: string;
  skill_name: string;
  issued_at_seconds: number;
  expires_at_seconds: number;
  used_at_seconds: number | null;
};

export type WorldAccessTokenRecord = {
  token_id: string;
  world_access_token: string;
  session_id: string;
  agent_id: string;
  user_id: string;
  issued_at_seconds: number;
  expires_at_seconds: number;
  revoked_at_seconds: number | null;
};
