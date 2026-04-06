"use client";

import { useState } from "react";
import { ArrowRight, Flame, LoaderCircle, Search, ShieldCheck, Sparkles } from "lucide-react";

import { AlertModal } from "@/components/analyze/alert-modal";
import { AnalysisCard } from "@/components/analyze/analysis-card";
import { ProductListCard } from "@/components/analyze/product-list-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PopularCategory, ProductAnalysis } from "@/lib/realprice/types";

interface RealPriceAppProps {
  initialAnalysis: ProductAnalysis;
  recentChecks: ProductAnalysis[];
  trendingDeals: ProductAnalysis[];
  categories: PopularCategory[];
  starterExamples: readonly string[];
}

export function RealPriceApp({
  initialAnalysis,
  recentChecks,
  trendingDeals,
  categories,
  starterExamples
}: RealPriceAppProps) {
  const [query, setQuery] = useState(initialAnalysis.query);
  const [analysis, setAnalysis] = useState<ProductAnalysis>(initialAnalysis);
  const [recent, setRecent] = useState<ProductAnalysis[]>(recentChecks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  async function analyze(nextQuery?: string) {
    const finalQuery = (nextQuery ?? query).trim();

    if (!finalQuery) {
      setError("Paste a product name or product URL to analyze.");
      return;
    }

    setQuery(finalQuery);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: finalQuery })
      });

      const payload = (await response.json().catch(() => null)) as { analysis?: ProductAnalysis; error?: string } | null;

      if (!response.ok || !payload?.analysis) {
        throw new Error(payload?.error ?? "Unable to analyze this product right now.");
      }

      const nextAnalysis = payload.analysis;

      setAnalysis(nextAnalysis);
      setRecent((current) => {
        const next = [nextAnalysis, ...current.filter((item) => item.productName !== nextAnalysis.productName)];
        return next.slice(0, 4);
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to analyze this product right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="panel-card rounded-[2rem] p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Main app</p>
                  <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    Find out if today&apos;s price is actually worth paying.
                  </h1>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
                    Paste a product name or listing URL. RealPrice compares the current number against a fair-price estimate, recent trend data, and suspicious markdown behavior.
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-300">
                  Startup-ready mock intelligence
                </div>
              </div>

              <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Paste a product name or URL"
                  />
                  <Button size="lg" className="sm:min-w-[180px]" onClick={() => void analyze()} disabled={loading}>
                    {loading ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Analyzing
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5" />
                        Analyze product
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {starterExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => void analyze(example)}
                      className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <AnalysisCard analysis={analysis} onSetAlert={() => setAlertOpen(true)} />
          </section>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="panel-card rounded-[1.8rem] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">How we analyze</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">Trust the verdict, inspect the math.</h2>

              <div className="mt-6 space-y-4">
                {[
                  ["Fair-value model", "A category-aware estimate of what the item should cost in a normal buying window."],
                  ["Recent price baseline", "The current price is compared against recent average pricing and recent lows."],
                  ["Sale credibility", "We test whether the claimed markdown looks real or inflated."]
                ].map(([title, description]) => (
                  <div key={title} className="rounded-[1.3rem] border border-white/10 bg-slate-950/55 p-4">
                    <p className="font-medium text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-card rounded-[1.8rem] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Popular categories</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-white">Quick starts</h3>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => void analyze(category.exampleQuery)}
                    className="rounded-[1.25rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-left transition hover:border-white/20 hover:bg-slate-950/80"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{category.name}</p>
                      <ArrowRight className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{category.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <ProductListCard title="Recently checked" eyebrow="History" items={recent} onPick={(value) => void analyze(value)} />
            <ProductListCard title="Trending deals" eyebrow="Radar" items={trendingDeals} onPick={(value) => void analyze(value)} />

            <section className="panel-card rounded-[1.8rem] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-300/10 text-sky-300">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Signal quality</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-white">What makes this feel real</h3>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm leading-6 text-slate-300">
                {[
                  "Believable pricing logic seeded by product and category.",
                  "Deterministic mock data so the same item gives consistent results.",
                  "Reusable analysis layer ready for live APIs or scraping later."
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <Sparkles className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

      <AlertModal
        open={alertOpen}
        productName={analysis.productName}
        suggestedPrice={analysis.alertTargetPrice}
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
}
