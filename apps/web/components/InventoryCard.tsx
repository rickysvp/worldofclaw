import type { InventoryItem } from "@/lib/types";

type InventoryCardProps = {
  inventory: InventoryItem[];
};

const quality_copy: Record<InventoryItem["quality"], string> = {
  rough: "粗制",
  stable: "稳定",
  refined: "精制"
};

export function InventoryCard(props: InventoryCardProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-ash-900/85 p-5 shadow-panel">
      <h3 className="text-lg font-semibold text-slate-100">Inventory</h3>
      <div className="mt-4 space-y-3">
        {props.inventory.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-ash-850/70 px-4 py-3">
            <div>
              <div className="text-sm font-medium text-slate-200">{item.label}</div>
              <div className="text-xs text-slate-500">{item.item_type} · {quality_copy[item.quality]}</div>
            </div>
            <div className="text-right text-sm text-slate-200">x{item.quantity}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
