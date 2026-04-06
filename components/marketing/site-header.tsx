import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
            <span className="font-display text-lg font-semibold text-transparent bg-[linear-gradient(120deg,#dffcf1,#7dd3fc)] bg-clip-text">RP</span>
          </span>
          <span>
            <span className="block font-display text-lg font-semibold text-white">RealPrice</span>
            <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Price intelligence</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <Link href="/analyze" className={buttonStyles({ variant: "secondary", size: "sm" })}>
          Try RealPrice
        </Link>
      </div>
    </header>
  );
}
