import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="panel-card flex flex-col gap-6 rounded-[1.8rem] px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <p className="font-display text-2xl font-semibold text-white">RealPrice</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          A polished startup-style MVP that helps shoppers understand whether a price is genuinely good, merely average, or inflated.
        </p>
      </div>

      <div className="flex flex-wrap gap-5 text-sm text-slate-300">
        <Link href="/analyze" className="transition hover:text-white">
          Open app
        </Link>
        <a href="#features" className="transition hover:text-white">
          Features
        </a>
        <a href="#pricing" className="transition hover:text-white">
          Pricing
        </a>
        <a href="#faq" className="transition hover:text-white">
          FAQ
        </a>
      </div>
    </footer>
  );
}
