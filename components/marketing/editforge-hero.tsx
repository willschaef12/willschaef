import Link from "next/link";
import { ArrowRight, Sparkles, WandSparkles } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";

const statCards = [
  { label: "Output formats", value: "3" },
  { label: "Auto pacing styles", value: "4" },
  { label: "FFmpeg export", value: "MP4" }
];

const featurePills = ["Secure uploads", "Audio-driven timing", "Downloadable render"];

export function EditForgeHero() {
  return (
    <section className="grid items-center gap-12 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
          <Sparkles className="h-4 w-4 text-[var(--forge-accent-soft)]" />
          FFmpeg-backed auto editing for creator teams
        </div>

        <h1 className="mt-8 max-w-4xl font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Turn raw clips into a <span className="text-gradient">client-ready edit</span> in minutes.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          EditForge ingests multiple source clips plus one soundtrack, builds a paced timeline automatically, normalizes the footage, and exports a finished MP4 you can review immediately.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/editor" className={buttonStyles({ size: "lg" })}>
            Try It Now
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#features" className={buttonStyles({ size: "lg", variant: "secondary" })}>
            How It Works
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {featurePills.map((pill) => (
            <span key={pill} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              {pill}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {statCards.map((card) => (
            <div key={card.label} className="panel-surface-soft rounded-3xl p-5">
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-white">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="hero-glow panel-surface relative rounded-[2rem] p-5">
          <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Render board</p>
                <p className="mt-2 font-display text-2xl font-semibold text-white">Promo edit A-12</p>
              </div>
              <div className="rounded-full border border-[rgba(54,210,255,0.28)] bg-[rgba(54,210,255,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--forge-electric)]">
                Live
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.4rem] border border-white/10 bg-[#0a1220] p-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Source clips</span>
                  <span>12 loaded</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <div className="h-28 flex-1 rounded-2xl bg-[linear-gradient(135deg,rgba(255,107,44,0.28),rgba(255,255,255,0.04))]" />
                  <div className="h-28 flex-1 rounded-2xl bg-[linear-gradient(135deg,rgba(54,210,255,0.22),rgba(255,255,255,0.04))]" />
                  <div className="h-28 flex-1 rounded-2xl bg-[linear-gradient(135deg,rgba(255,186,127,0.28),rgba(255,255,255,0.04))]" />
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-[#0a1220] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,107,44,0.12)] text-[var(--forge-accent)]">
                    <WandSparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Audio-driven assembly</p>
                    <p className="text-sm text-slate-400">Trim, normalize, concat, soundtrack overlay</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[82, 66, 94].map((width, index) => (
                    <div key={width} className="rounded-full bg-white/5 p-1">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#ff6b2c,#36d2ff)]"
                        style={{ width: `${width}%`, opacity: 0.9 - index * 0.12 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-5 -left-5 rounded-3xl border border-white/10 bg-black/35 px-5 py-4 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Average turnaround</p>
          <p className="mt-2 font-display text-3xl font-semibold text-white">&lt; 2 min</p>
        </div>
      </div>
    </section>
  );
}
