"use client";

import { useEffect, useMemo, useState } from "react";
import { FeedList } from "../../components/FeedList";
import { RiskBadge } from "../../components/RiskBadge";
import { SectionHeader } from "../../components/SectionHeader";
import { Sidebar } from "../../components/Sidebar";
import { Topbar } from "../../components/Topbar";
import { world_feed_filters, polling_interval_ms } from "../../lib/constants";
import { formatRelativeTime } from "../../lib/format";
import type { WorldFeedFilter, WorldFeedResponse } from "../../lib/types";

const fetchFeed = async (filter: WorldFeedFilter): Promise<WorldFeedResponse> => {
  const response = await fetch(`/api/world-feed?filter=${filter}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("failed to load world feed");
  }
  return response.json() as Promise<WorldFeedResponse>;
};

export default function WorldFeedPage() {
  const [filter, setFilter] = useState<WorldFeedFilter>("all");
  const [data, setData] = useState<WorldFeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const next = await fetchFeed(filter);
        if (!cancelled) {
          setData(next);
          setError(null);
        }
      } catch (load_error) {
        if (!cancelled) {
          setError(load_error instanceof Error ? load_error.message : "world feed error");
        }
      }
    };

    void load();
    const timer = window.setInterval(load, polling_interval_ms);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [filter]);

  const relatedCount = useMemo(
    () => data?.events.filter((event) => event.is_my_claw_related).length ?? 0,
    [data]
  );

  if (!data) {
    return <main className="min-h-screen px-6 py-10 text-slate-300">正在连接 World Feed...</main>;
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar className="h-fit lg:sticky lg:top-4" />
        <div className="space-y-4">
          <Topbar
            title="World Feed"
            subtitle="持续观察世界正在发生的事。大部分事情会自己运转，你只需要在值得介入的时候进入 Inbox。"
            session={data.session}
            status={data.status}
          />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section className="rounded-3xl border border-slate-800 bg-ash-900/85 p-5 shadow-panel">
              <SectionHeader
                eyebrow="Recent 20"
                title="世界事件流"
                description="按时间倒序显示最近 20 条事件，并高亮与你的 Claw 相关的动态。"
                right_slot={
                  <div className="flex flex-wrap gap-2">
                    {world_feed_filters.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setFilter(item.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${filter === item.value ? "border-signal-blue/40 bg-signal-blue/10 text-signal-blue" : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                }
              />
              {error ? <p className="mt-6 text-sm text-signal-high">{error}</p> : null}
              <div className="mt-5">
                <FeedList events={data.events} />
              </div>
            </section>
            <aside className="space-y-4">
              <section className="rounded-3xl border border-slate-800 bg-ash-900/85 p-5 shadow-panel">
                <SectionHeader eyebrow="Runtime" title="世界状态摘要" description="帮助你快速判断现在是否值得介入。" />
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-ash-850/80 p-4">
                    <div className="text-xs text-slate-500">今日目标提示</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{data.status.today_goal_hint}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-ash-850/80 p-4">
                    <div className="text-xs text-slate-500">当前风险等级</div>
                    <div className="mt-2"><RiskBadge level={data.status.current_risk_level} /></div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-ash-850/80 p-4">
                    <div className="text-xs text-slate-500">最近一次系统同步</div>
                    <div className="mt-2 text-sm text-slate-300">{formatRelativeTime(data.status.last_sync_at)}</div>
                  </div>
                </div>
              </section>
              <section className="rounded-3xl border border-rust-300/20 bg-rust-300/10 p-5 shadow-panel">
                <div className="text-[11px] uppercase tracking-[0.28em] text-rust-300/80">观察提示</div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                  <li>与你的 Claw 相关事件：{relatedCount} 条</li>
                  <li>优先盯住 market 和 conflict 两类筛选。</li>
                  <li>如果风险升高，不要急着手操，先回 Inbox 拍板。</li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
