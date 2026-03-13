"use client";

import { useEffect, useMemo, useState } from "react";
import { DecisionCard } from "../../components/DecisionCard";
import { DecisionDrawer } from "../../components/DecisionDrawer";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeader } from "../../components/SectionHeader";
import { Sidebar } from "../../components/Sidebar";
import { Topbar } from "../../components/Topbar";
import { decision_views, polling_interval_ms } from "../../lib/constants";
import type { DecisionCard as DecisionCardType, DecisionCardsResponse, DecisionView } from "../../lib/types";

const fetchDecisionCards = async (): Promise<DecisionCardsResponse> => {
  const response = await fetch("/api/decision-cards", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("failed to load decision cards");
  }
  return response.json() as Promise<DecisionCardsResponse>;
};

export default function InboxPage() {
  const [data, setData] = useState<DecisionCardsResponse | null>(null);
  const [cards, setCards] = useState<DecisionCardType[]>([]);
  const [view, setView] = useState<DecisionView>("pending");
  const [selectedCard, setSelectedCard] = useState<DecisionCardType | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next = await fetchDecisionCards();
      if (!cancelled) {
        setData(next);
        setCards(next.cards);
      }
    };

    void load();
    const timer = window.setInterval(load, polling_interval_ms * 2);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleCards = useMemo(() => cards.filter((card) => card.status === view), [cards, view]);

  const patchCard = (target: DecisionCardType, patch: Partial<DecisionCardType>) => {
    setCards((current) => current.map((card) => (card.decision_id === target.decision_id ? { ...card, ...patch, last_updated_at: new Date().toISOString() } : card)));
  };

  if (!data) {
    return <main className="min-h-screen px-6 py-10 text-slate-300">正在加载决策卡...</main>;
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar className="h-fit lg:sticky lg:top-4" />
        <div className="space-y-4">
          <Topbar
            title="Decision Inbox"
            subtitle="这里不是操作台，而是审批台。大部分动作会自动推进，你只在高价值、高风险、高影响节点拍板。"
            session={data.session}
            status={data.status}
          />
          <section className="rounded-3xl border border-slate-800 bg-ash-900/85 p-5 shadow-panel">
            <SectionHeader
              eyebrow="Approval Driven"
              title="待处理决策卡"
              description="approve / reject / modify 都先更新本地 mock state，再给出 toast。"
              right_slot={
                <div className="flex flex-wrap gap-2">
                  {decision_views.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setView(item.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${view === item.value ? "border-signal-blue/40 bg-signal-blue/10 text-signal-blue" : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="mt-5 space-y-4">
              {visibleCards.length > 0 ? (
                visibleCards.map((card) => <DecisionCard key={card.decision_id} card={card} on_open={setSelectedCard} />)
              ) : (
                <EmptyState title="这个视图里没有卡片" description="当前没有需要你处理的决策，或者它们已经被归档。" />
              )}
            </div>
          </section>
        </div>
      </div>
      <DecisionDrawer
        card={selectedCard}
        on_close={() => setSelectedCard(null)}
        on_approve={(card, patch) => {
          patchCard(card, { ...patch, status: "processed" });
          setSelectedCard(null);
          setToast(`已批准：${card.title}`);
        }}
        on_reject={(card) => {
          patchCard(card, { status: "processed" });
          setSelectedCard(null);
          setToast(`已拒绝：${card.title}`);
        }}
        on_modify={(card, patch) => {
          patchCard(card, patch);
          setSelectedCard(null);
          setToast(`已修改：${card.title}`);
        }}
      />
      {toast ? (
        <div className="fixed bottom-5 right-5 rounded-full border border-signal-blue/30 bg-ash-900/95 px-4 py-3 text-sm text-slate-100 shadow-panel">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
