import type { EventType } from "@/lib/types";

type EventTagProps = {
  event_type: EventType;
};

const label_by_type: Record<EventType, string> = {
  market: "市场",
  conflict: "冲突",
  organization: "组织",
  nearby: "附近",
  system: "系统"
};

const tone_by_type: Record<EventType, string> = {
  market: "border-signal-blue/30 bg-signal-blue/10 text-signal-blue",
  conflict: "border-signal-high/30 bg-signal-high/10 text-signal-high",
  organization: "border-rust-300/30 bg-rust-300/10 text-rust-300",
  nearby: "border-signal-low/30 bg-signal-low/10 text-signal-low",
  system: "border-slate-600 bg-slate-700/40 text-slate-300"
};

export function EventTag(props: EventTagProps) {
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] ${tone_by_type[props.event_type]}`}>{label_by_type[props.event_type]}</span>;
}
