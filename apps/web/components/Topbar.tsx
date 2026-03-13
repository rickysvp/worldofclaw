import { formatRelativeTime } from "@/lib/format";
import type { MockUserSession, WorldStatus } from "@/lib/types";

type TopbarProps = {
  title: string;
  subtitle: string;
  status: WorldStatus;
  session: MockUserSession;
};

export function Topbar(props: TopbarProps) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-ash-900/85 p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-rust-300/80">正在运行的世界控制台</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">{props.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{props.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-ash-850/80 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">World Tick</div>
            <div className="mt-1 text-lg font-semibold text-white">{props.status.world_tick}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-ash-850/80 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">在线 Claw</div>
            <div className="mt-1 text-lg font-semibold text-white">{props.status.online_claw_count}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-ash-850/80 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Contested</div>
            <div className="mt-1 text-lg font-semibold text-white">{props.status.contested_sector_count}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-ash-850/80 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">会话</div>
            <div className="mt-1 text-sm font-semibold text-white">{props.session.status_label}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4 text-xs text-slate-400">
        <span>观察者：{props.session.display_name}</span>
        <span>活跃 Claw：{props.session.active_claw_name}</span>
        <span>最近同步：{formatRelativeTime(props.status.last_sync_at)}</span>
      </div>
    </div>
  );
}
