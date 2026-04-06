import { cn } from "@/lib/realprice/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}

export function SectionHeading({ eyebrow, title, description, align = "left" }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300/90">{eyebrow}</p>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-300">{description}</p>
    </div>
  );
}
