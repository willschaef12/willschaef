import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="panel-surface flex flex-col gap-6 rounded-[1.85rem] px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <p className="font-display text-2xl font-semibold text-white">EditForge</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          A polished local MVP for automatic video assembly with secure uploads, FFmpeg rendering, and downloadable exports.
        </p>
      </div>

      <div className="flex flex-wrap gap-5 text-sm text-slate-300">
        <Link href="/editor" className="transition hover:text-white">
          Launch editor
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
