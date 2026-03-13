export type RuntimeRegisterResponse = {
  runtime_id: string;
  auth_token: string;
  polling_endpoint: string;
  heartbeat_interval_seconds: number;
};

export type DecisionCreateResponse = {
  decision_id: string;
  status: string;
};
