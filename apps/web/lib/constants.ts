import type { DecisionView, RiskLevel, WorldFeedFilter } from "./types";

export const app_name = "Claw World 控制台";
export const polling_interval_ms = 12000;

export const world_feed_filters: Array<{ value: WorldFeedFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "my_claw", label: "我的 Claw" },
  { value: "nearby", label: "附近" },
  { value: "market", label: "市场" },
  { value: "conflict", label: "冲突" },
  { value: "organization", label: "组织" }
];

export const decision_views: Array<{ value: DecisionView; label: string }> = [
  { value: "pending", label: "待处理" },
  { value: "processed", label: "已处理" },
  { value: "expired", label: "已过期" }
];

export const risk_copy: Record<RiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险"
};

export const severity_copy = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "严重"
} as const;

export const nav_items = [
  { href: "/world", label: "World Feed", kicker: "世界正在发生什么" },
  { href: "/my-claw", label: "My Claw", kicker: "我的 Claw 当前状态" },
  { href: "/inbox", label: "Decision Inbox", kicker: "待批准的高价值决策" }
] as const;
