type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState(props: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-ash-900/70 p-8 text-center">
      <p className="text-base font-semibold text-slate-200">{props.title}</p>
      <p className="mt-2 text-sm text-slate-400">{props.description}</p>
    </div>
  );
}
