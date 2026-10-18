"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Printer,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Zap,
  History,
  Building2,
  Calendar,
  CreditCard,
  FileCheck2,
  MoreHorizontal,
  Copy,
  Archive,
  ArrowUpRight,
} from "lucide-react";
import { formatCents } from "@/lib/finance/calculator";
import {
  PAYMENT_STATUS_CONFIG,
  ALLOWED_PAYMENT_STATE_TRANSITIONS,
  InvoicePaymentStatus,
} from "@/lib/stripe/connect-v2-architecture";
import { InvoiceRecord } from "@/lib/db";
import { DocumentSession2Panel } from "@/components/document-session2-panel";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleDuplicate = async () => {
    try {
      setMoreMenuOpen(false);
      const res = await fetch(`/api/invoices/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.invoice) {
        setActionNotice(`Successfully duplicated as ${data.invoice.invoice_number}`);
        setTimeout(() => {
          window.location.href = `/invoices/${data.invoice.id}`;
        }, 1000);
      } else {
        setTransitionError(data.error || "Failed to duplicate invoice.");
      }
    } catch (e: any) {
      setTransitionError(e.message || "Failed to duplicate.");
    }
  };

  const handleArchive = () => {
    setMoreMenuOpen(false);
    setActionNotice("Invoice archived to records.");
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (data.success && data.invoice) {
        setInvoice(data.invoice);
      }
    } catch (e) {
      console.error("Failed to load invoice:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleTransition = async (nextStatus: InvoicePaymentStatus, note?: string) => {
    try {
      setTransitioning(true);
      setTransitionError(null);
      const res = await fetch(`/api/invoices/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus, note }),
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        setInvoice(data.invoice);
      } else {
        setTransitionError(data.error || "Transition failed.");
      }
    } catch (e: any) {
      setTransitionError(e.message || "Failed to execute payment transition.");
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-mono text-slate-500">
        Loading invoice record #{id}...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-800 font-bold">Invoice Not Found</div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-agios-blue text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentStatus = invoice.payment_status;
  const statusConf = PAYMENT_STATUS_CONFIG[currentStatus] || PAYMENT_STATUS_CONFIG.pending;
  const allowedNext = ALLOWED_PAYMENT_STATE_TRANSITIONS[currentStatus] || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-field-border">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 font-mono">
                {invoice.invoice_number}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConf.badgeBg}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span>{statusConf.label}</span>
              </span>
            </div>
            <p className="text-xs text-field-muted mt-0.5">
              Organization: <strong className="text-slate-800">{invoice.org_name}</strong> &bull; Token: <span className="font-mono">{invoice.public_token}</span>
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/i/${invoice.public_token}`}
            target="_blank"
            className="touch-target px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-agios-blue" />
            <span>Public Client View</span>
          </Link>

          <Link
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            className="touch-target px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / PDF</span>
          </Link>

          {/* Action Menu (•••) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="touch-target p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 shadow-sm transition-colors flex items-center justify-center"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {moreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMoreMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-fade-in text-xs font-medium text-slate-700 divide-y divide-slate-100">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        const stripeEl = document.getElementById("stripe-machine-panel");
                        if (stripeEl) stripeEl.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>View transaction</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDuplicate}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duplicate invoice</span>
                    </button>
                  </div>
                  <div className="py-1">
                    <Link
                      href={`/api/invoices/${invoice.id}/pdf`}
                      target="_blank"
                      onClick={() => setMoreMenuOpen(false)}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      <span>Download PDF</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleArchive}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-rose-600 hover:text-rose-700"
                    >
                      <Archive className="w-3.5 h-3.5 text-rose-400" />
                      <span>Archive</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {transitionError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{transitionError}</span>
        </div>
      )}

      {/* =========================================================================
          STRIPE ACCOUNTS V2 5-STATE PAYMENT MACHINE SIMULATOR
         ========================================================================= */}
      <div id="stripe-machine-panel" className="rounded-xl border border-agios-obsidian-border bg-gradient-to-r from-agios-obsidian to-agios-navy text-white p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-agios-cyan" />
            <h2 className="text-sm font-bold font-mono tracking-wide text-white uppercase">
              Stripe Accounts v2 Direct Charge Simulator
            </h2>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            MERCHANT ACCT: <span className="text-agios-cyan font-bold">{invoice.stripe_connected_account_id}</span>
          </div>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed">
          In Session 1, multi-tenant contractor payments execute in isolated simulated mode. Payouts route directly into the contractor's connected merchant account rather than passing through platform SaaS subscriptions.
        </div>

        {/* Current State Indicator */}
        <div className="p-3.5 rounded-lg bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div>
            <span className="text-slate-400">CURRENT STATE: </span>
            <span className="font-bold text-agios-cyan uppercase text-sm">{currentStatus}</span>
            <span className="text-slate-400 block text-[11px] mt-0.5">{statusConf.description}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400">TRIGGER: </span>
            <span className="text-amber-300">{statusConf.webhookTrigger}</span>
          </div>
        </div>

        {/* Transition Buttons */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Allowable Webhook / Direct Charge Transitions:
          </div>
          <div className="flex flex-wrap gap-2">
            {allowedNext.length === 0 ? (
              <span className="text-xs text-slate-400 italic font-mono">
                Terminal state ({currentStatus}). No further transitions allowed under state machine rules.
              </span>
            ) : (
              allowedNext.map((next) => {
                const conf = PAYMENT_STATUS_CONFIG[next];
                return (
                  <button
                    key={next}
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleTransition(next)}
                    className="touch-target px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Transition &rarr; {conf.label}</span>
                    <span className="text-[10px] text-slate-400">({conf.webhookTrigger})</span>
                  </button>
                );
              })
            )}

            {/* Special simulation: fail simulation button when in pending */}
            {currentStatus === "pending" && (
              <button
                type="button"
                disabled={transitioning}
                onClick={() =>
                  handleTransition(
                    "failed",
                    "Simulated bank decline: insufficient_funds or card_declined"
                  )
                }
                className="touch-target px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2 border border-rose-500/30 transition-colors disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate Decline &rarr; Failed</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Line Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          <DocumentSession2Panel doc={invoice} onRefresh={loadInvoice} />
          {/* Customer & Address */}
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Customer & Job Details
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-field-muted block text-[11px]">Customer</span>
                <strong className="text-slate-900 text-sm block">{invoice.customer_name}</strong>
                {invoice.customer_company && (
                  <span className="text-slate-600 block">{invoice.customer_company}</span>
                )}
                <span className="text-slate-500 block">{invoice.customer_email}</span>
                <span className="text-slate-500 block">{invoice.customer_phone}</span>
              </div>

              <div>
                <span className="text-field-muted block text-[11px]">Service Address</span>
                <span className="text-slate-800 block">{invoice.service_address || "—"}</span>
                <span className="text-field-muted block text-[11px] mt-2">Due Date</span>
                <span className="font-mono font-bold text-slate-900">{invoice.due_date}</span>
              </div>
            </div>

            {invoice.creation_source !== "manual" && (
              <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
                <div>
                  <strong>AI Provenance:</strong> Generated via {invoice.creation_source} (Model: {invoice.ai_model_used || "gemini-3.8-flash"}). Confirmed by contractor: Yes.
                </div>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Itemized Line Items
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-field-border text-field-muted uppercase font-mono text-[11px]">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Category</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-field-border">
                  {(invoice.line_items || []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-medium text-slate-900">{item.description}</td>
                      <td className="py-3 px-3 text-center uppercase font-mono text-[11px] text-slate-500">
                        {item.category}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono font-tabular">
                        {formatCents(item.unit_price_cents)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold font-tabular text-slate-900">
                        {formatCents(item.line_total_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-field-border flex justify-end">
              <div className="w-72 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">{formatCents(invoice.subtotal_cents)}</span>
                </div>
                {invoice.discount_cents > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatCents(invoice.discount_cents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({invoice.tax_rate}%):</span>
                  <span>{formatCents(invoice.tax_amount_cents)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-agios-blue">{formatCents(invoice.total_amount_cents)}</span>
                </div>
                {invoice.amount_paid_cents > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Amount Paid:</span>
                    <span>-{formatCents(invoice.amount_paid_cents)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 font-bold text-sm text-slate-900 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span className={invoice.balance_due_cents > 0 ? "text-rose-600" : "text-emerald-600"}>
                    {formatCents(invoice.balance_due_cents)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Invoice Timeline */}
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                Immutable Invoice Timeline & Audit Log
              </h2>
            </div>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-6">
              {(invoice.events || []).map((evt) => (
                <div key={evt.id} className="relative text-xs space-y-1">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-agios-blue border-2 border-white"></div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="uppercase text-slate-600 font-semibold">{evt.event_type}</span>
                    <span>{evt.created_at}</span>
                  </div>
                  <div className="text-slate-800 font-medium">{evt.summary}</div>
                  <div className="text-[10px] font-mono text-slate-400">Actor: {evt.actor}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Summary & Metadata */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Invoice Meta
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-field-muted">Status:</span>
                <span className="font-semibold uppercase text-slate-900">{invoice.document_status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-field-muted">Payment:</span>
                <span className="font-semibold uppercase text-agios-blue">{invoice.payment_status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-field-muted">Currency:</span>
                <span className="font-mono text-slate-900">{invoice.currency}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-field-muted">Public Token:</span>
                <span className="font-mono text-[11px] text-slate-700">{invoice.public_token}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-field-muted">Stripe Intent:</span>
                <span className="font-mono text-[11px] text-slate-700">{invoice.stripe_payment_intent_id || "simulated"}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/i/${invoice.public_token}`}
                target="_blank"
                className="touch-target w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Public Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
