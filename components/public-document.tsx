"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CheckCircle2, CreditCard, Lock, Printer, ShieldCheck } from "lucide-react";
import {
  addDays,
  computePaymentSchedule,
  describePaymentSchedule,
  dueDaysLabel,
  formatCents,
} from "@/lib/math/calculator";
import { PAYMENT_STATUS_CONFIG } from "@/lib/stripe/connect-v2-architecture";
import { AttachmentList, AttachmentUploader } from "@/components/attachments";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", sent: "Sent", viewed: "Viewed", approved: "Approved",
  invoiced: "Invoiced", expired: "Expired", declined: "Declined",
};

export function PublicDocument({ token, kind }: { token: string; kind: "estimate" | "invoice" }) {
  const [doc, setDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/${token}`);
      const d = await res.json();
      if (d.success) setDoc(d.document);
      else setDoc(null);
    } catch {
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const act = async (action: string, msg: string) => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/public/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (!d.success) setError(d.error || "Action failed");
      else { setDoc(d.document); setNotice(msg); }
    } finally {
      setBusy(null);
    }
  };

  const convert = async () => {
    setBusy("convert");
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${doc.id}/convert`, { method: "POST" });
      const d = await res.json();
      if (!d.success) setError(d.error || "Conversion failed");
      else { setNotice(`Converted to invoice ${d.invoice.invoice_number}`); await load(); }
    } finally { setBusy(null); }
  };

  if (loading) {
    return <div className="min-h-screen bg-field-canvas flex items-center justify-center font-mono text-xs text-slate-500">Loading secure portal…</div>;
  }
  if (!doc) {
    return (
      <div className="min-h-screen bg-field-canvas flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-field-border text-center max-w-md space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
          <h2 className="text-lg font-bold text-slate-900">Link Expired or Not Found</h2>
          <Link href="/dashboard" className="inline-block px-4 py-2 rounded-lg bg-agios-blue text-white text-xs font-semibold">Go to Contractor Workspace</Link>
        </div>
      </div>
    );
  }

  const isEstimate = doc.document_type === "estimate";
  const brand = doc.org_brand_color || "#2563EB";
  const sched = computePaymentSchedule({
    totalAmountCents: doc.total_amount_cents,
    depositEnabled: !!doc.deposit_enabled,
    depositAmountCents: doc.deposit_amount_cents,
    amountPaidCents: doc.amount_paid_cents,
  });
  const fullyPaid = sched.totalOutstandingCents <= 0 && doc.amount_paid_cents > 0;
  const closed = ["declined", "expired"].includes(doc.document_status);
  const estimatePending = isEstimate && !["approved", "invoiced"].includes(doc.document_status) && !closed;
  const canPay = !closed && doc.document_status !== "draft" && doc.document_status !== "invoiced" && sched.totalOutstandingCents > 0 && doc.payment_status !== "refunded";
  const statusPill = isEstimate
    ? { label: STATUS_LABEL[doc.document_status] || doc.document_status, cls: "bg-slate-100 text-slate-700 border-slate-200" }
    : { label: (PAYMENT_STATUS_CONFIG as any)[doc.payment_status]?.label || doc.payment_status, cls: (PAYMENT_STATUS_CONFIG as any)[doc.payment_status]?.badgeBg || "" };
  const depositDue = addDays(doc.issue_date, doc.deposit_due_days || 0);
  const clientUploads = (doc.attachments || []).filter((a: any) => a.uploaded_by_role === "client");
  const contractorUploads = (doc.attachments || []).filter((a: any) => a.uploaded_by_role === "contractor");

  const btnPrimary = "touch-target w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 disabled:opacity-50";
  const btnSecondary = "touch-target w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs disabled:opacity-50";

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 px-2">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>SECURE {isEstimate ? "ESTIMATE" : "INVOICE"} PORTAL • STRIPE DIRECT CHARGE V2</span>
          </div>
          <button onClick={() => window.print()} className="text-agios-blue hover:underline flex items-center gap-1">
            <Printer className="w-3.5 h-3.5" /><span>Print / Save PDF</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
          <div className="h-2.5 w-full" style={{ backgroundColor: brand }} />
          <div className="p-6 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                {doc.org_logo_url ? (
                  <img
                    src={doc.org_logo_url}
                    alt={doc.org_name}
                    className={
                      doc.org_logo_format === "full"
                        ? "max-h-14 max-w-[130px] object-contain rounded"
                        : "w-14 h-14 rounded-xl border border-slate-200 object-contain p-1 bg-white shadow-sm"
                    }
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: brand }}
                  >
                    {(doc.org_name || "IP").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-2xl font-black tracking-tight" style={{ color: brand }}>{doc.org_name}</div>
                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {doc.org_address}<br />{doc.org_phone} • {doc.org_email}
                  </div>
                </div>
              </div>
              <div className="sm:text-right space-y-1">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">{isEstimate ? "ESTIMATE" : "INVOICE"}</div>
                <div className="text-xl font-black text-slate-900 font-mono">{doc.custom_code || doc.invoice_number}</div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusPill.cls}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />{statusPill.label}
                </span>
              </div>
            </div>

            {doc.project_title && (
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Project</div>
                <div className="text-sm font-bold text-slate-900">{doc.project_title}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">{isEstimate ? "Prepared For" : "Billed To"}</span>
                <div className="font-bold text-slate-900 text-sm">{doc.customer_name}</div>
                {doc.customer_company && <div className="text-slate-600">{doc.customer_company}</div>}
                {doc.service_address && <div className="text-slate-500">{doc.service_address}</div>}
                <div className="text-slate-500">{doc.customer_email}</div>
              </div>
              <div className="sm:text-right space-y-1 font-mono">
                <div><span className="text-slate-400">Issue Date: </span><strong className="text-slate-900">{doc.issue_date}</strong></div>
                {isEstimate && doc.expires_at && <div><span className="text-slate-400">Expires: </span><strong className="text-slate-900">{doc.expires_at}</strong></div>}
                {!isEstimate && <div><span className="text-slate-400">Due Date: </span><strong className="text-slate-900">{doc.due_date}</strong></div>}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
                    <th className="py-2.5 px-2">Description</th><th className="py-2.5 px-2 text-right">Qty</th>
                    <th className="py-2.5 px-2 text-right">Rate</th><th className="py-2.5 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(doc.line_items || []).map((it: any) => (
                    <tr key={it.id}>
                      <td className="py-3 px-2 font-medium text-slate-800">
                        {it.description}
                        {it.note && <span className="block text-[11px] text-slate-500 font-normal">{it.note}</span>}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">{it.quantity}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatCents(it.unit_price_cents)}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">{formatCents(it.line_total_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span className="font-bold text-slate-900">{formatCents(doc.subtotal_cents)}</span></div>
                {doc.discount_cents > 0 && <div className="flex justify-between text-emerald-600"><span>Discount:</span><span>-{formatCents(doc.discount_cents)}</span></div>}
                {doc.tax_amount_cents > 0 && <div className="flex justify-between text-slate-600"><span>Tax ({doc.tax_rate}%):</span><span>{formatCents(doc.tax_amount_cents)}</span></div>}
                {doc.late_fee_applied_cents > 0 && (
                  <div data-testid="late-fee-line" className="flex justify-between text-rose-600 font-bold"><span>Late Fee:</span><span>{formatCents(doc.late_fee_applied_cents)}</span></div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                  <span>Total:</span><span style={{ color: brand }}>{formatCents(doc.total_amount_cents)}</span>
                </div>
                {doc.amount_paid_cents > 0 && <div className="flex justify-between text-emerald-600"><span>Paid:</span><span>-{formatCents(doc.amount_paid_cents)}</span></div>}
                <div className="flex justify-between pt-1 font-bold text-sm text-slate-900 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span className={sched.totalOutstandingCents > 0 ? "text-rose-600" : "text-emerald-600"}>{formatCents(sched.totalOutstandingCents)}</span>
                </div>
              </div>
            </div>

            {doc.deposit_enabled === 1 && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold">Payment Schedule</div>
                <div>{describePaymentSchedule(doc.total_amount_cents - doc.late_fee_applied_cents, doc.deposit_amount_cents, doc.balance_due_days)}</div>
                <div className="font-mono text-[11px] text-blue-800">
                  Deposit {formatCents(doc.deposit_amount_cents)} — {dueDaysLabel(doc.deposit_due_days)} ({depositDue})
                  {sched.depositOutstandingCents <= 0 && " • PAID"}
                  <br />
                  Balance {formatCents(sched.remainingBalanceCents)} — {dueDaysLabel(doc.balance_due_days)} ({doc.due_date})
                </div>
              </div>
            )}

            {doc.client_message && <p className="text-xs text-slate-600 italic">{doc.client_message}</p>}

            {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</div>}
            {notice && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs" role="status">{notice}</div>}

            {/* Checkout */}
            {doc.document_status === "invoiced" && doc.converted_invoice_token ? (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between gap-3">
                <span>This estimate was approved and converted to an invoice.</span>
                <Link href={`/i/${doc.converted_invoice_token}`} className="px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold">View Invoice</Link>
              </div>
            ) : closed ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">This {isEstimate ? "estimate" : "document"} is {doc.document_status}.</div>
            ) : canPay || estimatePending ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-agios-cyan" /><h3 className="text-sm font-bold">Secure Card Checkout</h3></div>
                  <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">SIMULATED SANDBOX</span>
                </div>

                {doc.deposit_enabled === 1 && sched.depositPaidCents > 0 && (
                  <div className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="w-4 h-4" /><span>Deposit Paid ({formatCents(sched.depositPaidCents)})</span></div>
                )}

                {sched.nextKind === "deposit" && (
                  <>
                    <button disabled={!!busy} onClick={() => act("pay_deposit", "Deposit received. Thank you!")} className={btnPrimary}>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{busy === "pay_deposit" ? "Authorizing…" : isEstimate ? `Approve & Pay Deposit (${formatCents(sched.depositOutstandingCents)})` : `Pay Deposit Now (${formatCents(sched.depositOutstandingCents)})`}</span>
                    </button>
                    <button disabled={!!busy} onClick={() => act("pay_full", "Paid in full. Thank you!")} className={btnSecondary}>
                      Pay Full Amount ({formatCents(sched.totalOutstandingCents)})
                    </button>
                  </>
                )}
                {sched.nextKind === "balance" && (
                  <button disabled={!!busy} onClick={() => act(doc.deposit_enabled === 1 ? "pay_balance" : "pay_full", "Payment received. Thank you!")} className={btnPrimary}>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{doc.deposit_enabled === 1 && sched.depositPaidCents > 0 ? `Pay Remaining Balance (${formatCents(sched.balanceOutstandingCents)})` : `Pay Full Amount (${formatCents(sched.totalOutstandingCents)})`}</span>
                  </button>
                )}

                {estimatePending && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button disabled={!!busy} onClick={() => act("approve", "Estimate approved.")} className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold">Approve (pay later)</button>
                    <button disabled={!!busy} onClick={() => act("decline", "Estimate declined.")} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300">Decline</button>
                  </div>
                )}
              </div>
            ) : fullyPaid ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div><strong>Paid in Full.</strong> Thank you for your business! Funds settled directly to {doc.org_name}.</div>
              </div>
            ) : null}

            {isEstimate && !closed && doc.document_status !== "invoiced" && doc.document_status !== "draft" && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-600">Ready to bill? Convert this estimate to an invoice in one click.</span>
                <button disabled={!!busy} onClick={convert} className="px-3 py-2 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-50">
                  {busy === "convert" ? "Converting…" : "Convert to Invoice"}
                </button>
              </div>
            )}

            {contractorUploads.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Attachments from {doc.org_name}</div>
                <AttachmentList items={contractorUploads} />
              </div>
            )}

            {/* Client upload card */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-3" data-testid="client-attachments">
              <div className="text-sm font-bold text-slate-900">Client Attachments — Upload Photos or Documents</div>
              <AttachmentUploader endpoint={`/api/public/${token}/attachments`} onUploaded={() => { setNotice("Upload received."); load(); }} withCaption />
              {clientUploads.length > 0 && <AttachmentList items={clientUploads} />}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Image src="/logo.png" alt="Invoice Pro Agios logo" width={28} height={28} className="w-7 h-7 rounded-md object-contain" />
            <div className="text-left leading-tight">
              <div className="font-bold text-slate-600">Invoice Pro Agios</div>
              <div className="text-[10px]">An AGIOS Venture Studio Platform</div>
            </div>
          </div>
          <div className="font-mono text-[10px]">Environment: prototype_preview • Direct Merchant Charge</div>
        </div>
      </div>
    </div>
  );
}
