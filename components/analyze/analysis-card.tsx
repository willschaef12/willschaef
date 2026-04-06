import { BellRing, ShieldAlert, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PriceHistoryChart } from "@/components/analyze/price-history-chart";
import type { ProductAnalysis } from "@/lib/realprice/types";
import { cn, formatCompactDate, formatCurrency, formatPercent } from "@/lib/realprice/utils";

interface AnalysisCardProps {
  analysis: ProductAnalysis;
  onSetAlert: () => void;
}

export function AnalysisCard({ analysis, onSetAlert }: AnalysisCardProps) {
  const verdictTone =
    analysis.verdict === "Great Deal"
      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
      : analysis.verdict === "Fair Price"
        ? "border-sky-300/25 bg-sky-300/10 text-sky-100"
        : "border-rose-300/25 bg-rose-300/10 text-rose-100";

  const recommendationCopy =
    analysis.recommendation === "Buy Now"
      ? "The price is below its modeled fair range. This is a strong time to buy."
      : analysis.recommendation === "Watch"
        ? "The price is reasonable, but waiting for a cleaner dip could improve value."
        : "This listing looks expensive versus the recent market pattern. Hold off for now.";

  return (
    <section className="space-y-6">
      <div className="panel-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{analysis.category}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">{analysis.productName}</h2>
            <p className="mt-3 text-sm text-slate-400">
              Checked against {analysis.merchant} / {formatCompactDate(analysis.checkedAt)}
            </p>
          </div>

          <div className={cn("rounded-full border px-4 py-2 text-sm font-semibold", verdictTone)}>{analysis.verdict}</div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Current price", formatCurrency(analysis.currentPrice)],
            ["Fair price", formatCurrency(analysis.fairPrice)],
            ["Recent average", formatCurrency(analysis.averageRecentPrice)],
            ["Recent low", formatCurrency(analysis.lowestRecentPrice)]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.35rem] border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.45rem] border border-white/10 bg-slate-950/55 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/6 text-emerald-300">
                {analysis.recommendation === "Buy Now" ? (
                  <TrendingDown className="h-5 w-5" />
                ) : analysis.recommendation === "Watch" ? (
                  <Sparkles className="h-5 w-5" />
                ) : (
                  <TrendingUp className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Recommendation</p>
                <p className="mt-1 text-xl font-semibold text-white">{analysis.recommendation}</p>
              </div>
            </div>

            <p className="mt-4 text-base leading-7 text-slate-300">{recommendationCopy}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">{analysis.shortSummary}</p>
          </div>

          <div className="rounded-[1.45rem] border border-white/10 bg-slate-950/55 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Deal score</p>
            <p className="mt-2 font-display text-5xl font-semibold text-white">{analysis.dealScore}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Higher scores mean the current listing is tracking better against our modeled fair value and recent market behavior.
            </p>

            <Button variant="secondary" className="mt-6 w-full" onClick={onSetAlert}>
              <BellRing className="h-4 w-4" />
              Set Price Alert
            </Button>
          </div>
        </div>
      </div>

      <PriceHistoryChart history={analysis.history} />

      <div className="panel-card rounded-[1.8rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fake Sale Detector</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-white">
              {analysis.fakeSale.flagged ? "Suspicious markdown pattern" : "Markdown looks credible"}
            </h3>
          </div>

          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              analysis.fakeSale.flagged ? "bg-rose-400/10 text-rose-300" : "bg-emerald-300/10 text-emerald-300"
            )}
          >
            {analysis.fakeSale.flagged ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Claimed markdown", formatPercent(analysis.fakeSale.claimedDiscountPercent)],
            ["Market discount", formatPercent(analysis.fakeSale.marketDiscountPercent)],
            ["Reference price", formatCurrency(analysis.listPrice)]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.25rem] border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm font-medium text-white">Confidence: {analysis.fakeSale.confidence}</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            {analysis.fakeSale.reasons.map((reason) => (
              <li key={reason} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
