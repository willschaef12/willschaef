"use client";

import { useState } from "react";
import { BellRing, CircleCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/realprice/utils";

interface AlertModalProps {
  open: boolean;
  productName: string;
  suggestedPrice: number;
  onClose: () => void;
}

export function AlertModal({ open, productName, suggestedPrice, onClose }: AlertModalProps) {
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState(String(suggestedPrice));
  const [saved, setSaved] = useState(false);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="panel-card w-full max-w-lg rounded-[1.8rem] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Price alert</p>
            <h3 className="mt-2 font-display text-3xl font-semibold text-white">Watch {productName}</h3>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 text-slate-400 transition hover:border-white/20 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {saved ? (
          <div className="mt-8 rounded-[1.4rem] border border-emerald-300/20 bg-emerald-300/10 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-300/12 text-emerald-300">
              <CircleCheck className="h-6 w-6" />
            </div>
            <p className="mt-4 text-lg font-semibold text-white">Alert saved</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              We will notify you when {productName} falls to {formatCurrency(Number(targetPrice) || suggestedPrice)} or less.
            </p>
            <Button className="mt-6 w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-300">
              Suggested target: <span className="font-semibold text-white">{formatCurrency(suggestedPrice)}</span>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Target price</span>
              <Input value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} placeholder="299" />
            </label>

            <Button
              className="mt-2 w-full"
              onClick={() => setSaved(true)}
              disabled={!email.trim() || !targetPrice.trim()}
            >
              <BellRing className="h-4 w-4" />
              Save alert
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
