"use client";

import { useEffect, useState } from "react";
import { ClawStatusCard } from "../../components/ClawStatusCard";
import { InventoryCard } from "../../components/InventoryCard";
import { ObjectiveCard } from "../../components/ObjectiveCard";
import { SectionHeader } from "../../components/SectionHeader";
import { Sidebar } from "../../components/Sidebar";
import { Topbar } from "../../components/Topbar";
import { formatRelativeTime } from "../../lib/format";
import { polling_interval_ms } from "../../lib/constants";
import type { MyClawResponse } from "../../lib/types";

const fetchMyClaw = async (): Promise<MyClawResponse> => {
  const response = await fetch("/api/my-claw", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("failed to load claw state");
  }
  return response.json() as Promise<MyClawResponse>;
};

export default function MyClawPage() {
  const [data, setData] = useState<MyClawResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const next = await fetchMyClaw();
      if (!cancelled) {
        setData(next);
      }
    };

    void load();
    const timer = window.setInterval(load, polling_interval_ms);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!data) {
    return <main className="min-h-screen px-6 py-10 text-slate-300">正在加载你的 Claw...</main>;
  }

  const { claw } = data;

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar className="h-fit lg:sticky lg:top-4" />
        <div className="space-y-4">
          <Topbar
            title="My Claw"
            subtitle="这一页只回答四个问题：它现在在哪、在做什么、是否安全、你现在最值得干预什么。"
            session={data.session}
            status={data.status}
          />
          <ClawStatusCard claw={claw} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <section className="rounded-3xl border border-slate-800 bg-ash-900/85 p-5 shadow-panel">
                <SectionHeader title="行动记录" description="最近 10 条 action log，帮助你判断它是不是在稳定推进。" />
                <div className="mt-4 space-y-3">
                  {claw.action_logs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-slate-800 bg-ash-850/75 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-100">{log.summary}</div>
                          <div className="mt-1 text-xs text-slate-500">{log.action_type} · {log.location}</div>
                        </div>
                        <div className="text-xs text-slate-500">{formatRelativeTime(log.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <InventoryCard inventory={claw.inventory} />
            </div>
            <div className="space-y-4">
              <ObjectiveCard title="当前目标" body={claw.current_objective} footer={<div className="text-sm text-slate-400">上一次完成：{claw.last_completed_action}</div>} />
              <ObjectiveCard title="昨夜发生了什么" body={claw.last_night_summary} />
              <section className="rounded-3xl border border-slate-800 bg-ash-900/85 p-5 shadow-panel">
                <SectionHeader title="状态与介入建议" description="把安全、缺口和下一步建议压成一眼能读懂的卡片。" />
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-slate-800 bg-ash-850/75 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Trust Summary</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{claw.trust_summary}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-ash-850/75 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">它缺什么</div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      {claw.missing_needs.map((need) => <li key={need}>- {need}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-ash-850/75 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Onboarding / Protection / Graduation</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {claw.onboarding_status.map((badge) => (
                        <span key={badge.label} className={`rounded-full border px-3 py-1 text-xs ${badge.tone === "safe" ? "border-signal-low/30 bg-signal-low/10 text-signal-low" : badge.tone === "complete" ? "border-signal-blue/30 bg-signal-blue/10 text-signal-blue" : "border-rust-300/30 bg-rust-300/10 text-rust-300"}`}>{badge.label}</span>
                      ))}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-400">
                      {claw.onboarding_status.map((badge) => <p key={badge.label}>{badge.detail}</p>)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-rust-300/20 bg-rust-300/10 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-rust-300">推荐的三个下一步</div>
                    <div className="mt-3 space-y-3">
                      {claw.recommended_actions.map((recommendation) => (
                        <div key={recommendation.id} className="rounded-2xl border border-rust-300/20 bg-ash-900/50 p-3">
                          <div className="text-sm font-semibold text-slate-100">{recommendation.label}</div>
                          <div className="mt-1 text-sm text-slate-400">{recommendation.reason}</div>
                          <div className="mt-2 text-xs text-rust-300">干预价值：{recommendation.intervention_value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
