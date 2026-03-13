import { formatRiskLevel } from "../lib/format";
import type { DecisionCard as DecisionCardType } from "../lib/types";
import { RiskBadge } from "./RiskBadge";

type DecisionCardProps = {
  card: DecisionCardType;
  on_open: (card: DecisionCardType) => void;
};

export function DecisionCard(props: DecisionCardProps) {
  const { card } = props;

  return (
    <article className="rounded-3xl border border-slate-800 bg-ash-900/85 p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-rust-300/80">{card.decision_type}</div>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">{card.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{card.reason}</p>
        </div>
        <RiskBadge level={card.risk_level} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-ash-850/70 p-3"><div className="text-xs text-slate-500">推荐</div><div className="mt-1 text-sm text-white">{card.recommended_option}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-ash-850/70 p-3"><div className="text-xs text-slate-500">到期</div><div className="mt-1 text-sm text-white">{card.expires_in}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-ash-850/70 p-3"><div className="text-xs text-slate-500">影响位置</div><div className="mt-1 text-sm text-white">{card.affected_location}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-ash-850/70 p-3"><div className="text-xs text-slate-500">风险</div><div className="mt-1 text-sm text-white">{formatRiskLevel(card.risk_level)}</div></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        {card.affected_resources.map((item) => (
          <span key={item} className="rounded-full border border-slate-700 px-2 py-1">{item}</span>
        ))}
      </div>
      <button onClick={() => props.on_open(card)} className="mt-5 inline-flex rounded-full border border-signal-blue/40 bg-signal-blue/10 px-4 py-2 text-sm font-medium text-signal-blue transition hover:bg-signal-blue/20">
        打开审批抽屉
      </button>
    </article>
  );
}
