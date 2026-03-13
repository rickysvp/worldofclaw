import type { ReactNode } from "react";

type ObjectiveCardProps = {
  title: string;
  body: string;
  footer?: ReactNode;
};

export function ObjectiveCard(props: ObjectiveCardProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-ash-900/85 p-5 shadow-panel">
      <h3 className="text-lg font-semibold text-slate-100">{props.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{props.body}</p>
      {props.footer ? <div className="mt-4 border-t border-slate-800 pt-4">{props.footer}</div> : null}
    </section>
  );
}
