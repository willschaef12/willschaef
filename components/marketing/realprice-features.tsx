import { BellRing, ChartSpline, CircleDollarSign, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";

import { SectionHeading } from "@/components/ui/section-heading";

const featureCards = [
  {
    title: "Fair-price engine",
    description: "RealPrice compares the current listing against recent average pricing, recent lows, and category-aware value baselines.",
    icon: CircleDollarSign
  },
  {
    title: "Fake sale detector",
    description: "We estimate whether a huge markdown is real or just inflated anchor pricing dressed up as a sale.",
    icon: SearchCheck
  },
  {
    title: "Price history view",
    description: "Every result includes a readable mock trend chart so the app feels immediately useful while APIs are still a future extension.",
    icon: ChartSpline
  },
  {
    title: "Alerts and watchlists",
    description: "Shoppers can set a target price and keep tabs on items that are close, but not worth buying yet.",
    icon: BellRing
  },
  {
    title: "Popular category coverage",
    description: "The MVP ships with realistic presets for electronics, shoes, collectibles, gaming, and adjacent home products.",
    icon: Sparkles
  },
  {
    title: "Built for trust",
    description: "The interface explains how pricing is modeled, what the verdict means, and when to act versus wait.",
    icon: ShieldCheck
  }
];

const trustPoints = [
  "Current price versus fair price estimate",
  "Average recent price and recent low",
  "Suspicious markdown spread versus market behavior"
];

export function RealPriceFeatures() {
  return (
    <section id="features" className="space-y-12 scroll-mt-28">
      <SectionHeading
        eyebrow="Features"
        title="Built to answer the question shoppers actually care about."
        description="RealPrice focuses on one high-value decision: should you buy now, wait, or keep watching? The first release is mock-backed, but the product logic is structured for real data providers later."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map(({ title, description, icon: Icon }) => (
          <article key={title} className="panel-card rounded-[1.7rem] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 text-emerald-300">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold text-white">{title}</h3>
            <p className="mt-3 text-base leading-7 text-slate-300">{description}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="panel-card rounded-[1.7rem] p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">How it works</p>
          <h3 className="mt-4 font-display text-3xl font-semibold text-white">A simple verdict stack that users can trust at a glance.</h3>
          <div className="mt-8 space-y-5">
            {trustPoints.map((point, index) => (
              <div key={point} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 font-display text-lg text-white">
                  {index + 1}
                </div>
                <p className="pt-2 text-base leading-7 text-slate-300">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card rounded-[1.7rem] p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Believable immediately", "Seeded mock data makes the app feel alive from the first local run."],
              ["Ready for real APIs", "The analysis engine is isolated so scraping or commerce APIs can replace the mock layer later."],
              ["Consumer-first UX", "Verdicts, recommendations, alerts, and charts are all designed for fast decision making."],
              ["Mobile-ready", "The layout compresses cleanly for shoppers checking deals from their phones."]
            ].map(([title, description]) => (
              <div key={title} className="rounded-[1.3rem] border border-white/10 bg-white/6 p-5">
                <p className="font-medium text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
