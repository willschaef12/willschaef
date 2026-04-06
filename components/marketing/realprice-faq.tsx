import { SectionHeading } from "@/components/ui/section-heading";

const faqs = [
  {
    question: "Is RealPrice using live retailer scraping yet?",
    answer:
      "Not in this version. The app uses a structured mock analysis layer with realistic category behavior, so the experience feels complete while leaving a clean path for live APIs later."
  },
  {
    question: "How do verdicts work?",
    answer:
      "The starter model compares the current price with a fair-price estimate, the average recent price, and the recent low. From there it labels the item as Great Deal, Fair Price, or Overpriced."
  },
  {
    question: "What does the fake sale detector flag?",
    answer:
      "It estimates whether the claimed markdown is much larger than the actual market discount suggested by recent pricing. If the spread is too wide, RealPrice flags it as suspicious."
  },
  {
    question: "Can I run this locally without extra services?",
    answer:
      "Yes. The app is self-contained, requires no external APIs for version one, and is designed to be easy to run with standard Next.js tooling."
  }
];

export function RealPriceFaq() {
  return (
    <section id="faq" className="space-y-12 scroll-mt-28">
      <SectionHeading
        eyebrow="FAQ"
        title="Clear about what is real today and what is ready for later."
        description="The current build gives you a polished consumer experience with believable price analysis, while keeping the backend simple and swappable."
      />

      <div className="grid gap-4">
        {faqs.map((faq, index) => (
          <details key={faq.question} className="panel-card rounded-[1.5rem] p-6" open={index === 0}>
            <summary className="cursor-pointer list-none font-display text-xl font-medium text-white">{faq.question}</summary>
            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
