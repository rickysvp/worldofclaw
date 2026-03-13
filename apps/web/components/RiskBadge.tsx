import { formatRiskLevel } from "../lib/format";
import type { RiskLevel } from "../lib/types";

type RiskBadgeProps = {
  level: RiskLevel;
};

const tone_by_level: Record<RiskLevel, string> = {
  low: "border-signal-low/30 bg-signal-low/10 text-signal-low",
  medium: "border-signal-medium/30 bg-signal-medium/10 text-signal-medium",
  high: "border-signal-high/30 bg-signal-high/10 text-signal-high"
};

export function RiskBadge(props: RiskBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone_by_level[props.level]}`}>
      {formatRiskLevel(props.level)}
    </span>
  );
}
