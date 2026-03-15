"use client";

import { ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ToolbarButton({
  active = false,
  disabled = false,
  children,
  title,
  onClick,
  className
}: {
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  title?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "rounded-full border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-sky-400/60 bg-sky-400/14 text-sky-50 shadow-[0_0_0_1px_rgba(88,166,255,0.18)]"
          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/8",
        disabled && "cursor-not-allowed opacity-40 hover:border-white/10 hover:bg-white/5",
        className
      )}
    >
      {children}
    </button>
  );
}

export function PanelCard({
  title,
  subtitle,
  actions,
  children,
  className
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-chrome border border-white/10 bg-[linear-gradient(180deg,rgba(18,26,37,0.96),rgba(11,17,26,0.92))] shadow-panel backdrop-blur",
        className
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-[0.2em] text-slate-100 uppercase">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function CollapsibleSection({
  title,
  subtitle,
  open,
  onToggle,
  actions,
  children
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.025]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{open ? "Hide" : "Show"}</span>
        </div>
      </button>
      {open ? <div className="border-t border-white/8 px-4 py-4">{children}</div> : null}
    </section>
  );
}

export function SliderControl({
  label,
  description,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
  onCommit,
  onInteractionStart
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
  onCommit: () => void;
  onInteractionStart: () => void;
}) {
  const commit = () => onCommit();

  return (
    <label className="block" title={description}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-200">{label}</span>
        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs font-medium text-slate-300">
          {displayValue}
        </span>
      </div>
      <input
        data-ignore-shortcuts="true"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          onInteractionStart();
          onChange(Number(event.target.value));
        }}
        onPointerDown={onInteractionStart}
        onPointerUp={commit}
        onTouchStart={onInteractionStart}
        onTouchEnd={commit}
        onKeyUp={commit}
        onBlur={commit}
        className="skyroom-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
      />
    </label>
  );
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060c]/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,26,37,0.98),rgba(10,16,24,0.96))] p-6 shadow-chrome">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-50">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p> : null}
          </div>
          <ToolbarButton onClick={onClose}>Close</ToolbarButton>
        </div>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 flex items-center justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}
