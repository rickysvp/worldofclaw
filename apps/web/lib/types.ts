export type Severity = "low" | "medium" | "high" | "critical";
export type RiskLevel = "low" | "medium" | "high";
export type WorldFeedFilter = "all" | "my_claw" | "nearby" | "market" | "conflict" | "organization";
export type DecisionView = "pending" | "processed" | "expired";
export type ClawRole = "拾荒商" | "护送者" | "中继维护者" | "废土协调者";
export type EventType = "market" | "conflict" | "organization" | "nearby" | "system";

export type MockUserSession = {
  user_id: string;
  display_name: string;
  active_claw_name: string;
  status_label: string;
};

export type WorldStatus = {
  world_tick: number;
  online_claw_count: number;
  contested_sector_count: number;
  today_platform_event_count: number;
  today_goal_hint: string;
  current_risk_level: RiskLevel;
  last_sync_at: string;
};

export type WorldFeedEvent = {
  id: string;
  timestamp: string;
  event_type: EventType;
  title: string;
  summary: string;
  sector_name: string;
  related_agents: string[];
  severity: Severity;
  filter_tags: WorldFeedFilter[];
  is_my_claw_related: boolean;
};

export type InventoryItem = {
  id: string;
  item_type: string;
  label: string;
  quantity: number;
  quality: "rough" | "stable" | "refined";
};

export type ActionLog = {
  id: string;
  timestamp: string;
  action_type: string;
  summary: string;
  outcome: "success" | "warning" | "failed";
  location: string;
  risk_level: RiskLevel;
};

export type RecommendedAction = {
  id: string;
  label: string;
  reason: string;
  intervention_value: string;
};

export type OnboardingBadge = {
  label: string;
  tone: "active" | "safe" | "complete";
  detail: string;
};

export type ClawState = {
  claw_id: string;
  claw_name: string;
  role: ClawRole;
  current_sector: string;
  power: number;
  durability: number;
  credits: number;
  cargo: string;
  trust_summary: string;
  organization: string;
  current_objective: string;
  current_action: string;
  last_completed_action: string;
  is_safe: boolean;
  missing_needs: string[];
  best_intervention: string;
  action_logs: ActionLog[];
  inventory: InventoryItem[];
  onboarding_status: OnboardingBadge[];
  recommended_actions: RecommendedAction[];
  last_night_summary: string;
};

export type DecisionOption = {
  id: string;
  label: string;
  consequence_hint: string;
};

export type DecisionCard = {
  decision_id: string;
  decision_type: "trade" | "route" | "escort";
  title: string;
  reason: string;
  risk_level: RiskLevel;
  expires_in: string;
  recommended_option: string;
  options: DecisionOption[];
  affected_resources: string[];
  affected_location: string;
  quantity: number;
  route_risk: "low" | "medium" | "high";
  budget_cap: number;
  status: DecisionView;
  last_updated_at: string;
};

export type WorldFeedResponse = {
  session: MockUserSession;
  status: WorldStatus;
  events: WorldFeedEvent[];
};

export type MyClawResponse = {
  session: MockUserSession;
  status: WorldStatus;
  claw: ClawState;
};

export type DecisionCardsResponse = {
  session: MockUserSession;
  status: WorldStatus;
  cards: DecisionCard[];
};

export type StatusResponse = {
  session: MockUserSession;
  status: WorldStatus;
};
