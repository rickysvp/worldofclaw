import { formatCredits } from "../lib/format";
import type { ClawState } from "../lib/types";

type ClawStatusCardProps = {
  claw: ClawState;
};

export function ClawStatusCard(props: ClawStatusCardProps) {
  const { claw } = props;

  return (
    <section className="rounded-3xl border border-slate-800 bg-ash-900/85 p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rust-300/80">唯一活跃 Claw</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">{claw.claw_name}</h2>
          <p className="mt-2 text-sm text-slate-400">{claw.role} · {claw.organization}</p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-sm ${claw.is_safe ? "border-signal-low/30 bg-signal-low/10 text-signal-low" : "border-signal-high/30 bg-signal-high/10 text-signal-high"}`}>
          {claw.is_safe ? "当前处于可控状态" : "当前处于不安全状态"}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-ash-850/80 p-4"><div className="text-xs text-slate-500">当前位置</div><div className="mt-1 text-lg text-white">{claw.current_sector}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-ash-850/80 p-4"><div className="text-xs text-slate-500">Power</div><div className="mt-1 text-lg text-white">{claw.power}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-ash-850/80 p-4"><div className="text-xs text-slate-500">Durability</div><div className="mt-1 text-lg text-white">{claw.durability}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-ash-850/80 p-4"><div className="text-xs text-slate-500">Credits</div><div className="mt-1 text-lg text-white">{formatCredits(claw.credits)}</div></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-ash-850/80 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">现在在做什么</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{claw.current_action}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-ash-850/80 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">最值得你干预的事</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{claw.best_intervention}</p>
        </div>
      </div>
    </section>
  );
}
