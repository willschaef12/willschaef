import { ArrowUpRight, Clock3 } from "lucide-react";

import type { ProductAnalysis } from "@/lib/realprice/types";
import { cn, formatCurrency } from "@/lib/realprice/utils";

interface ProductListCardProps {
  title: string;
  eyebrow: string;
  items: ProductAnalysis[];
  onPick: (query: string) => void;
}

export function ProductListCard({ title, eyebrow, items, onPick }: ProductListCardProps) {
  return (
    <section className="panel-card rounded-[1.8rem] p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{eyebrow}</p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
        <Clock3 className="h-5 w-5 text-slate-500" />
      </div>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <button
            key={`${title}-${item.productName}`}
            type="button"
            onClick={() => onPick(item.query)}
            className="flex w-full items-center justify-between gap-4 rounded-[1.3rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-left transition hover:border-white/20 hover:bg-slate-950/75"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{item.productName}</p>
              <p className="mt-1 text-sm text-slate-400">
                {item.category} / {formatCurrency(item.currentPrice)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                  item.verdict === "Great Deal"
                    ? "bg-emerald-300/12 text-emerald-200"
                    : item.verdict === "Fair Price"
                      ? "bg-sky-300/12 text-sky-200"
                      : "bg-rose-300/12 text-rose-200"
                )}
              >
                {item.verdict}
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
