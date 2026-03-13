import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  right_slot?: ReactNode;
};

export function SectionHeader(props: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {props.eyebrow ? <p className="text-[11px] uppercase tracking-[0.32em] text-rust-300/80">{props.eyebrow}</p> : null}
        <h2 className="text-xl font-semibold text-slate-100">{props.title}</h2>
        {props.description ? <p className="max-w-2xl text-sm text-slate-400">{props.description}</p> : null}
      </div>
      {props.right_slot ? <div className="shrink-0">{props.right_slot}</div> : null}
    </div>
  );
}
