"use client";

import { useEffect, useState } from "react";
import type { DecisionCard as DecisionCardType } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

type DecisionDrawerProps = {
  card: DecisionCardType | null;
  on_close: () => void;
  on_approve: (card: DecisionCardType, patch: { quantity: number; route_risk: "low" | "medium" | "high"; budget_cap: number }) => void;
  on_reject: (card: DecisionCardType) => void;
  on_modify: (card: DecisionCardType, patch: { quantity: number; route_risk: "low" | "medium" | "high"; budget_cap: number }) => void;
};

export function DecisionDrawer(props: DecisionDrawerProps) {
  const [quantity, setQuantity] = useState(0);
  const [routeRisk, setRouteRisk] = useState<"low" | "medium" | "high">("low");
  const [budgetCap, setBudgetCap] = useState(0);

  useEffect(() => {
    if (!props.card) {
      return;
    }
    setQuantity(props.card.quantity);
    setRouteRisk(props.card.route_risk);
    setBudgetCap(props.card.budget_cap);
  }, [props.card]);

  if (!props.card) {
    return null;
  }

  const card = props.card;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-ash-900 px-6 py-5 shadow-panel">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-rust-300/80">Decision Drawer</div>
            <h3 className="mt-2 text-xl font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{card.reason}</p>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge level={card.risk_level} />
            <button onClick={props.on_close} className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">关闭</button>
          </div>
        </div>
        <div className="mt-5 flex-1 space-y-4 overflow-auto">
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">quantity</span>
            <input value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} type="number" min={0} className="w-full rounded-2xl border border-slate-700 bg-ash-850 px-4 py-3 text-sm text-white outline-none ring-0 focus:border-signal-blue/50" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">route_risk</span>
            <select value={routeRisk} onChange={(event) => setRouteRisk(event.target.value as "low" | "medium" | "high")} className="w-full rounded-2xl border border-slate-700 bg-ash-850 px-4 py-3 text-sm text-white outline-none focus:border-signal-blue/50">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">budget_cap</span>
            <input value={budgetCap} onChange={(event) => setBudgetCap(Number(event.target.value))} type="number" min={0} className="w-full rounded-2xl border border-slate-700 bg-ash-850 px-4 py-3 text-sm text-white outline-none focus:border-signal-blue/50" />
          </label>
          <div className="rounded-2xl border border-slate-800 bg-ash-850/70 p-4 text-sm text-slate-400">
            <div className="font-medium text-slate-200">可操作选项</div>
            <ul className="mt-3 space-y-2">
              {card.options.map((option) => (
                <li key={option.id}>
                  <span className="font-medium text-slate-100">{option.label}</span>
                  <span className="ml-2">{option.consequence_hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={() => props.on_reject(card)}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            reject
          </button>
          <button
            onClick={() => props.on_modify(card, { quantity, route_risk: routeRisk, budget_cap: budgetCap })}
            className="rounded-full border border-rust-300/30 bg-rust-300/10 px-4 py-2 text-sm text-rust-300 hover:bg-rust-300/20"
          >
            modify
          </button>
          <button
            onClick={() => props.on_approve(card, { quantity, route_risk: routeRisk, budget_cap: budgetCap })}
            className="rounded-full border border-signal-low/30 bg-signal-low/10 px-4 py-2 text-sm text-signal-low hover:bg-signal-low/20"
          >
            approve
          </button>
        </div>
      </div>
    </div>
  );
}
