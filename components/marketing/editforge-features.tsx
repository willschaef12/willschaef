import { Layers3, Music4, ShieldCheck, SlidersHorizontal, TimerReset, Video } from "lucide-react";

import { SectionHeading } from "@/components/ui/section-heading";

const featureCards = [
  {
    title: "Upload-first workflow",
    description: "Drag in multiple clips and one soundtrack with clear validation, remove controls, and responsive feedback.",
    icon: Video
  },
  {
    title: "Audio-timed pacing",
    description: "The MVP timeline builder repeats and trims clips to cover the soundtrack duration without manual editing.",
    icon: Music4
  },
  {
    title: "Format presets",
    description: "Export for vertical, horizontal, or square delivery with normalized resolution, crop, and frame rate.",
    icon: SlidersHorizontal
  },
  {
    title: "Reliable FFmpeg pipeline",
    description: "Every render goes through a predictable normalize, segment, concat, and audio-overlay sequence for local stability.",
    icon: Layers3
  },
  {
    title: "Job polling",
    description: "The editor reports queue, processing, completion, and failure states so users are never left guessing.",
    icon: TimerReset
  },
  {
    title: "Cleanup aware",
    description: "Uploads and intermediate files are removed after successful renders, and stale jobs are purged on a rolling TTL.",
    icon: ShieldCheck
  }
];

const steps = [
  "Upload your source clips and one soundtrack.",
  "Choose format, pacing profile, and ordering rules.",
  "Generate the edit, poll progress, review the MP4, and download it."
];

export function EditForgeFeatures() {
  return (
    <section id="features" className="space-y-12 scroll-mt-28">
      <SectionHeading
        eyebrow="How It Works"
        title="A startup-grade workflow with a practical render engine underneath."
        description="EditForge focuses on the first version that actually works locally: secure uploads, clear options, FFmpeg orchestration, and a polished review experience."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map(({ title, description, icon: Icon }) => (
          <article key={title} className="panel-surface rounded-[1.75rem] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[var(--forge-accent-soft)]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold text-white">{title}</h3>
            <p className="mt-3 text-base leading-7 text-slate-300">{description}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel-surface rounded-[1.75rem] p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pipeline</p>
          <h3 className="mt-4 font-display text-3xl font-semibold text-white">From uploads to export without manual editing.</h3>
          <div className="mt-8 space-y-5">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 font-display text-lg text-white">
                  {index + 1}
                </div>
                <p className="pt-2 text-base leading-7 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-surface rounded-[1.75rem] p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Secure handling", "Files are renamed and written into isolated per-job directories."],
              ["Export consistency", "Every source clip is normalized to the selected resolution and 30 fps."],
              ["Simple scaling", "The first version stays on the safe path: no fragile AI transitions or unreliable browser encoding."],
              ["Product polish", "Landing, editor, progress, and download flows feel like one coherent product."]
            ].map(([title, description]) => (
              <div key={title} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-5">
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
