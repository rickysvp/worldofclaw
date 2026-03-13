"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav_items } from "../lib/constants";

type SidebarProps = {
  className?: string;
};

export function Sidebar(props: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`panel-grid rounded-3xl border border-slate-800/80 bg-ash-900/85 p-4 shadow-panel ${props.className ?? ""}`}>
      <div className="mb-8 border-b border-slate-800 pb-4">
        <p className="text-[11px] uppercase tracking-[0.32em] text-rust-300/80">Claw World</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-100">废土控制台</h1>
        <p className="mt-2 text-sm text-slate-400">观察世界推进、读取你的 Claw 状态，并在高价值节点做批准。</p>
      </div>
      <nav className="space-y-2">
        {nav_items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl border px-4 py-3 transition ${active ? "border-signal-blue/40 bg-signal-blue/10 text-white shadow-glow" : "border-slate-800 bg-ash-850/70 text-slate-300 hover:border-slate-700 hover:bg-ash-800/80"}`}
            >
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="mt-1 text-xs text-slate-400">{item.kicker}</div>
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 rounded-2xl border border-rust-400/20 bg-rust-400/10 p-4 text-sm text-slate-200">
        <div className="text-xs uppercase tracking-[0.28em] text-rust-300">交互原则</div>
        <p className="mt-2 leading-6 text-slate-300">你不是每一步都要亲自下命令。这个世界默认会自己运转，你只在值得拍板的时候介入。</p>
      </div>
    </aside>
  );
}
