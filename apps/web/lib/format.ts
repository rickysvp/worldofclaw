import { risk_copy, severity_copy } from "./constants";
import type { RiskLevel, Severity } from "./types";

export const formatRelativeTime = (iso: string): string => {
  const delta_seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (delta_seconds < 60) {
    return `${delta_seconds} 秒前`;
  }
  const minutes = Math.floor(delta_seconds / 60);
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时前`;
  }
  return `${Math.floor(hours / 24)} 天前`;
};

export const formatCredits = (value: number): string => `${value.toLocaleString("zh-CN")} cr`;

export const formatRiskLevel = (risk_level: RiskLevel): string => risk_copy[risk_level];

export const formatSeverity = (severity: Severity): string => severity_copy[severity];

export const formatTimestamp = (iso: string): string =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
