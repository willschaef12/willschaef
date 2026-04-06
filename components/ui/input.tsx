import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/realprice/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-14 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-base text-white placeholder:text-slate-500 focus:border-emerald-300/45 focus:outline-none focus:ring-2 focus:ring-emerald-300/20",
        className
      )}
      {...props}
    />
  );
}
