import Link from "next/link";
import { ArrowRight, BadgeCheck, BellRing, TrendingDown } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { formatCurrency } from "@/lib/realprice/utils";

const metrics = [
  { label: "Deals scored", value: "120k+" },
  { label: "Tracked categories", value: "4 core" },
  { label: "Starter signal", value: "Market-based" }
];

export function RealPriceHero() {
  return (
    <section className="grid items-center gap-12 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/8 px-4 py-2 text-sm text-emerald-100">
          <BadgeCheck className="h-4 w-4 text-emerald-300" />
          Know if a sale is actually worth it
        </div>

        <h1 className="mt-8 max-w-4xl font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Price-check anything in seconds with <span className="text-gradient">RealPrice</span>.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Paste a product name or product URL and RealPrice estimates fair value, compares current pricing against recent trends, and flags suspicious markdowns before you buy.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/analyze" className={buttonStyles({ size: "lg" })}>
            Start checking prices
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#features" className={buttonStyles({ size: "lg", variant: "secondary" })}>
            How it works
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="panel-card-soft rounded-[1.4rem] p-5">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="hero-card panel-card rounded-[2rem] p-5">
          <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(165deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live analysis</p>
                <p className="mt-2 font-display text-2xl font-semibold text-white">Sony WH-1000XM5</p>
              </div>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
                Great deal
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Current", formatCurrency(279)],
                ["Fair price", formatCurrency(319)],
                ["Recent low", formatCurrency(268)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.25rem] border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-slate-950/60 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-white">Fake sale detector</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Claimed markdown looks credible. The current price is 13% below the recent average and within 4% of the modeled low.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-5 -left-5 rounded-[1.4rem] border border-white/10 bg-slate-950/75 px-4 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-300/10 text-sky-300">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Price alert</p>
              <p className="mt-1 text-sm font-medium text-white">Ping me under {formatCurrency(289)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
