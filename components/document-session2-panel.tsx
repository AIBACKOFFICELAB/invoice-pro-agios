"use client";

import React, { useState } from "react";
import { formatCents } from "@/lib/math/calculator";
import { AttachmentList, AttachmentUploader } from "@/components/attachments";
import { ArrowRight, Bell, Clock, FileCheck2, Paperclip, ShieldAlert, Send } from "lucide-react";

export function DocumentSession2Panel({ doc, onRefresh }: { doc: any; onRefresh: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const isEstimate = doc.document_type === "estimate";

  const post = async (url: string, body: any = {}, actionKey: string, successMsg: string) => {
    setBusy(actionKey);
    setMsg(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setMsg({ text: data.error || "Action failed", error: true });
      } else {
        setMsg({ text: successMsg });
        onRefresh();
      }
    } catch (e: any) {
      setMsg({ text: e.message || "Network error", error: true });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Strip */}
      <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center justify-between">
          <span>Session 2 Controls & Automation</span>
          <span className="text-[11px] font-mono text-agios-cyan font-normal bg-agios-navy px-2 py-0.5 rounded">
            {isEstimate ? "Estimate Module" : "Invoice Module"}
          </span>
        </h2>

        {msg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              msg.error ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            <span>{msg.text}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          {/* Send Document */}
          {doc.document_status === "draft" && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => post(`/api/invoices/${doc.id}/status`, { status: "sent" }, "send", "Document dispatched via sandbox token link.")}
              className="touch-target px-3.5 py-2 rounded-lg bg-agios-blue hover:bg-blue-600 text-white font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{busy === "send" ? "Sending..." : `Send ${isEstimate ? "Estimate" : "Invoice"} to Client`}</span>
            </button>
          )}

          {/* Estimate -> Invoice 1-click Conversion */}
          {isEstimate && doc.document_status !== "invoiced" && doc.document_status !== "declined" && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => post(`/api/invoices/${doc.id}/convert`, {}, "convert", "Estimate converted to invoice successfully!")}
              className="touch-target px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{busy === "convert" ? "Converting..." : "1-Click Convert to Invoice"}</span>
            </button>
          )}

          {/* Trigger Late Fee Simulation */}
          {!isEstimate && doc.late_fee_enabled === 1 && doc.late_fee_applied_cents === 0 && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => post(`/api/invoices/${doc.id}/late-fee`, { simulate: true }, "late-fee", "Overdue simulated & late fee added.")}
              className="touch-target px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{busy === "late-fee" ? "Calculating..." : "Simulate Overdue + Apply Late Fee"}</span>
            </button>
          )}

          {/* Trigger Reminders */}
          <button
            type="button"
            disabled={!!busy}
            onClick={() => post("/api/reminders/run", { orgId: doc.organization_id, force: true }, "reminders", "Scheduled reminders processed (Sandbox).")}
            className="touch-target px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5 text-slate-600" />
            <span>{busy === "reminders" ? "Triggering..." : "Trigger Scheduled Reminders Now (Sandbox)"}</span>
          </button>
        </div>
      </div>

      {/* Deposit Schedule & Late Fee Summary */}
      {(doc.deposit_enabled === 1 || doc.late_fee_enabled === 1) && (
        <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
            Payment Terms, Deposit & Late Fee Rules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {doc.deposit_enabled === 1 && (
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 block">Deposit Schedule Active</span>
                <div>Type: {doc.deposit_type === "percentage" ? `${doc.deposit_value}%` : "Flat"}</div>
                <div>Amount: <strong className="text-blue-900">{formatCents(doc.deposit_amount_cents)}</strong></div>
                <div>Paid: <strong className="text-emerald-700">{formatCents(doc.deposit_paid_cents)}</strong></div>
                <div>Terms: Due in {doc.deposit_due_days} days &bull; Balance due in {doc.balance_due_days} days</div>
              </div>
            )}
            {doc.late_fee_enabled === 1 && (
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100 space-y-1">
                <span className="font-bold text-amber-900 block">Automated Late Fee Rule</span>
                <div>Rule: {doc.late_fee_type === "percentage" ? `${doc.late_fee_value}% of overdue amount` : formatCents(doc.late_fee_value)}</div>
                <div>Grace Period: {doc.late_fee_grace_days} days</div>
                <div>Applied: <strong className={doc.late_fee_applied_cents > 0 ? "text-rose-600" : "text-slate-600"}>{formatCents(doc.late_fee_applied_cents)}</strong></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two-Way Attachments */}
      <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Document Attachments (Two-Way)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {(doc.attachments || []).length} item(s)
          </span>
        </div>

        <AttachmentList items={doc.attachments || []} />

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-xs font-semibold text-slate-700 block">Upload Contractor Attachment (PDF / Photos)</span>
          <AttachmentUploader
            endpoint={`/api/invoices/${doc.id}/attachments`}
            onUploaded={onRefresh}
            withCaption
          />
        </div>
      </div>

      {/* Scheduled Reminders Queue */}
      <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Scheduled Reminder Engine
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {(doc.reminders || []).length} trigger(s)
          </span>
        </div>

        {(!doc.reminders || doc.reminders.length === 0) ? (
          <div className="text-xs text-slate-400 italic font-mono">No reminders configured for this document.</div>
        ) : (
          <div className="space-y-2">
            {doc.reminders.map((rem: any) => (
              <div
                key={rem.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-bold text-slate-800 uppercase block">{rem.target_stage.replace("_", " ")}</span>
                  <span className="text-slate-500 text-[11px]">Trigger: {rem.trigger_key} &bull; Offset: {rem.trigger_offset_days} day(s)</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-700 font-semibold block">{rem.scheduled_for}</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      rem.status === "sent"
                        ? "bg-emerald-100 text-emerald-800"
                        : rem.status === "skipped_paid"
                        ? "bg-slate-200 text-slate-700"
                        : rem.status === "canceled"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {rem.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
