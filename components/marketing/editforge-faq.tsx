import { SectionHeading } from "@/components/ui/section-heading";

const faqs = [
  {
    question: "What does the first version of EditForge actually automate?",
    answer:
      "It trims and reuses uploaded clips to cover the soundtrack duration, normalizes every segment to a consistent frame size and frame rate, concatenates the result, and overlays the audio into a final MP4."
  },
  {
    question: "Does it do beat detection or AI shot selection?",
    answer:
      "Not in this MVP. The editing styles currently change pacing rules and timeline behavior rather than using model-based media analysis. That keeps the local build reliable."
  },
  {
    question: "What does the server need to run?",
    answer:
      "A Node 20 environment plus FFmpeg and FFprobe installed locally or exposed through the `FFMPEG_PATH` and `FFPROBE_PATH` environment variables."
  },
  {
    question: "Can I use this for real deliverables?",
    answer:
      "Yes for simple draft generation. It is designed as a working foundation: stable local rendering, polished UX, and a clear extension path for smarter shot selection later."
  }
];

export function EditForgeFaq() {
  return (
    <section id="faq" className="space-y-12 scroll-mt-28">
      <SectionHeading
        eyebrow="FAQ"
        title="Clear constraints, no fake magic."
        description="The app is intentionally honest about the first release: it renders real edits, keeps the pipeline understandable, and leaves room for smarter sequencing later."
      />

      <div className="grid gap-4">
        {faqs.map((faq) => (
          <details key={faq.question} className="panel-surface rounded-[1.5rem] p-6 group" open={faq === faqs[0]}>
            <summary className="cursor-pointer list-none font-display text-xl font-medium text-white">
              {faq.question}
            </summary>
            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
