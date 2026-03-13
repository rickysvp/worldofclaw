import { formatRelativeTime, formatSeverity } from "@/lib/format";
import type { WorldFeedEvent } from "@/lib/types";
import { EventTag } from "./EventTag";

type FeedItemProps = {
  event: WorldFeedEvent;
};

export function FeedItem(props: FeedItemProps) {
  const { event } = props;

  return (
    <article className={`rounded-2xl border p-4 transition ${event.is_my_claw_related ? "border-rust-300/40 bg-rust-300/10" : "border-slate-800 bg-ash-850/75"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <EventTag event_type={event.event_type} />
            <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-400">{event.sector_name}</span>
            {event.is_my_claw_related ? <span className="rounded-full border border-rust-300/30 bg-rust-300/10 px-2 py-1 text-[11px] text-rust-300">关联我的 Claw</span> : null}
          </div>
          <h3 className="text-base font-semibold text-slate-100">{event.title}</h3>
          <p className="text-sm leading-6 text-slate-400">{event.summary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="text-xs text-slate-500">{formatRelativeTime(event.timestamp)}</span>
          <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-300">严重度 {formatSeverity(event.severity)}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {event.related_agents.length > 0 ? event.related_agents.map((agent) => <span key={agent} className="rounded-full bg-slate-900/70 px-2 py-1">{agent}</span>) : <span>无明确关联 Agent</span>}
      </div>
    </article>
  );
}
