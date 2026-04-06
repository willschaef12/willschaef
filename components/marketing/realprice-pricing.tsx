import Link from "next/link";
import { Check } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/realprice/utils";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    description: "For occasional deal checks and quick verdicts.",
    features: ["Unlimited manual checks", "Mock price history", "One saved alert"],
    highlight: false
  },
  {
    name: "Plus",
    price: "$9",
    description: "For shoppers who monitor launches, restocks, and sale cycles.",
    features: ["Multi-item watchlists", "SMS and email alerts", "Retailer-specific insights"],
    highlight: true
  },
  {
    name: "Teams",
    price: "$29",
    description: "For resellers and buying groups that track multiple categories.",
    features: ["Shared dashboards", "API exports", "Priority signal updates"],
    highlight: false
  }
];

export function RealPricePricing() {
  return (
    <section id="pricing" className="space-y-12 scroll-mt-28">
      <SectionHeading
        eyebrow="Pricing"
        title="Positioned like a real consumer product from day one."
        description="The MVP runs on realistic mock pricing, but the product packaging already reflects how a full alert and tracking service would be sold."
        align="center"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {tiers.map((tier) => (
          <article
            key={tier.name}
            className={cn(
              "rounded-[1.85rem] p-[1px]",
              tier.highlight
                ? "bg-[linear-gradient(160deg,rgba(77,226,168,0.9),rgba(125,211,252,0.75))]"
                : "bg-white/10"
            )}
          >
            <div className="panel-card h-full rounded-[1.8rem] p-8">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold text-white">{tier.name}</h3>
                {tier.highlight ? (
                  <span className="rounded-full bg-emerald-300/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
                    Best value
                  </span>
                ) : null}
              </div>

              <p className="mt-5 font-display text-5xl font-semibold text-white">
                {tier.price}
                <span className="ml-2 text-base font-medium text-slate-400">/ month</span>
              </p>
              <p className="mt-3 text-base leading-7 text-slate-300">{tier.description}</p>

              <ul className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/6 text-emerald-300">
                      <Check className="h-4 w-4" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/analyze"
                className={buttonStyles({
                  variant: tier.highlight ? "primary" : "secondary",
                  size: "lg",
                  className: "mt-8 w-full"
                })}
              >
                Launch app
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
