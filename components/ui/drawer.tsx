"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">{footer}</div>}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-sm font-semibold">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-1.5 ${value === o.value ? "bg-agios-blue text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
