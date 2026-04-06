import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/realprice/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#4de2a8,#2dd4bf_45%,#7dd3fc)] text-slate-950 shadow-[0_18px_60px_rgba(77,226,168,0.22)] hover:-translate-y-0.5 hover:brightness-105",
  secondary:
    "border border-white/12 bg-white/6 text-white hover:border-white/22 hover:bg-white/10",
  ghost: "bg-transparent text-slate-300 hover:bg-white/6 hover:text-white",
  subtle: "bg-slate-900/60 text-emerald-200 hover:bg-slate-900/80"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base"
};

export function buttonStyles({
  className,
  size = "md",
  variant = "primary"
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60",
    variantStyles[variant],
    sizeStyles[size],
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button className={buttonStyles({ className, variant, size })} {...props} />;
}
