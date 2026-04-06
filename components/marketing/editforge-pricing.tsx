import Link from "next/link";
import { Check } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/editforge/utils";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    description: "Prototype your edit flow locally.",
    features: ["Single local workstation", "FFmpeg render pipeline", "One active export at a time"],
    highlight: false
  },
  {
    name: "Studio",
    price: "$29",
    description: "The product positioning most teams would expect.",
    features: ["Priority render queue", "Brand presets and style packs", "Cloud storage handoff"],
    highlight: true
  },
  {
    name: "Scale",
    price: "$149",
    description: "For agencies producing repeatable campaign edits.",
    features: ["Multi-user workspaces", "Webhook callbacks", "Managed render infrastructure"],
    highlight: false
  }
];

export function EditForgePricing() {
  return (
    <section id="pricing" className="space-y-12 scroll-mt-28">
      <SectionHeading
        eyebrow="Pricing Mockup"
        title="Positioned like a real product, even in MVP form."
        description="The current app runs locally, but the pricing model frames where the product can go once the editing pipeline is productionized."
        align="center"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {tiers.map((tier) => (
          <article
            key={tier.name}
            className={cn(
              "rounded-[1.85rem] p-[1px]",
              tier.highlight
                ? "bg-[linear-gradient(160deg,rgba(255,107,44,0.8),rgba(54,210,255,0.7))]"
                : "bg-white/10"
            )}
          >
            <div className="panel-surface h-full rounded-[1.8rem] p-8">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold text-white">{tier.name}</h3>
                {tier.highlight ? (
                  <span className="rounded-full bg-[rgba(255,107,44,0.14)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--forge-accent-soft)]">
                    Most likely
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
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-[var(--forge-electric)]">
                      <Check className="h-4 w-4" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/editor"
                className={buttonStyles({
                  size: "lg",
                  variant: tier.highlight ? "primary" : "secondary",
                  className: "mt-8 w-full"
                })}
              >
                Launch Editor
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
