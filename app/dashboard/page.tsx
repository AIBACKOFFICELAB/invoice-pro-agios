"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Mic,
  FileText,
  Search,
  ExternalLink,
  Printer,
  ChevronRight,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { formatCents } from "@/lib/finance/calculator";
import { PAYMENT_STATUS_CONFIG, InvoicePaymentStatus } from "@/lib/stripe/connect-v2-architecture";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_company: string | null;
  issue_date: string;
  due_date: string;
  total_amount_cents: number;
  balance_due_cents: number;
  payment_status: InvoicePaymentStatus;
  document_status: string;
  public_token: string;
  creation_source: string;
}

interface KPIs {
  totalInvoices: number;
  collectedRevenueCents: number;
  pendingProcessingVolumeCents: number;
  overdueBalanceCents: number;
  averageSettlementDays: string;
}

export default function DashboardPage() {
  const [orgId, setOrgId] = useState("org_apex_01");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async (activeOrgId: string, filter: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices?orgId=${activeOrgId}&status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
        setKpis(data.kpis || null);
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("active_org_id") || "org_apex_01";
    setOrgId(saved);
    loadData(saved, statusFilter);

    const handleOrgChange = (e: any) => {
      if (e.detail?.id) {
        setOrgId(e.detail.id);
        loadData(e.detail.id, statusFilter);
      }
    };
    window.addEventListener("org_changed", handleOrgChange);
    return () => window.removeEventListener("org_changed", handleOrgChange);
  }, [statusFilter]);

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
      (inv.customer_company && inv.customer_company.toLowerCase().includes(q))
    );
  });

  const statusTabs: { id: string; label: string; icon: any }[] = [
    { id: "all", label: "All Invoices", icon: Layers },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "processing", label: "Processing", icon: RefreshCw },
    { id: "succeeded", label: "Succeeded", icon: CheckCircle2 },
    { id: "failed", label: "Failed", icon: AlertTriangle },
    { id: "refunded", label: "Refunded", icon: RotateCcw },
  ];

  return (
    <div className="space-y-6">
      {/* =========================================================================
          DAYLIGHT FIELD MATRIX: HEADER & QUICK ACTIONS
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-field-border">
        <div>
          <h1 className="text-2xl font-black text-field-text tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-field-muted mt-1">
            Real-time accounts receivable ledger with Stripe Accounts v2 Direct Charge settlement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/invoices/new"
            className="touch-target px-4 py-2 rounded-lg bg-agios-blue hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>+ New Invoice</span>
          </Link>

          <Link
            href="/ai"
            className="touch-target px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-field-border text-slate-700 font-medium text-xs flex items-center gap-2 transition-colors"
          >
            <Mic className="w-3.5 h-3.5 text-agios-cyan" />
            <span>Voice / IDP Extract</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          REAL-TIME KPI METRIC CARDS
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Collected Revenue */}
        <div className="bg-white rounded-xl border border-field-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-field-muted mb-2">
            <span>Collected Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-tabular">
            {formatCents(kpis?.collectedRevenueCents || 0)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>Settled directly via Stripe v2</span>
          </div>
        </div>

        {/* Card 2: Pending / Processing Volume */}
        <div className="bg-white rounded-xl border border-field-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-field-muted mb-2">
            <span>Pending / Processing</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-tabular">
            {formatCents(kpis?.pendingProcessingVolumeCents || 0)}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            Active customer payment pipeline
          </div>
        </div>

        {/* Card 3: Overdue Balance */}
        <div className="bg-white rounded-xl border border-field-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-field-muted mb-2">
            <span>Overdue Balance</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 font-tabular">
            {formatCents(kpis?.overdueBalanceCents || 0)}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Past due payment reminders eligible
          </div>
        </div>

        {/* Card 4: Average Settlement Time */}
        <div className="bg-white rounded-xl border border-field-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-field-muted mb-2">
            <span>Avg. Settlement Time</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-tabular">
            {kpis?.averageSettlementDays || "—"}
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">
            Direct card & ACH rails
          </div>
        </div>
      </div>

      {/* =========================================================================
          5-STATE FILTER TABS & SEARCH
         ========================================================================= */}
      <div className="bg-white rounded-xl border border-field-border p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {statusTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`touch-target px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-field-border text-xs focus:outline-none focus:ring-2 focus:ring-agios-blue/20 focus:border-agios-blue bg-field-canvas"
            />
          </div>
        </div>

        {/* =========================================================================
            INVOICE LEDGER TABLE (Mobile responsive & scannable)
           ========================================================================= */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            Loading tenant invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="text-slate-400 text-sm">No invoices found matching current filter.</div>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-agios-blue text-white text-xs font-semibold"
            >
              + Create First Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-field-border text-field-muted uppercase font-mono text-[11px] bg-slate-50/50">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Due Date</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-field-border">
                {filteredInvoices.map((inv) => {
                  const statusConf = PAYMENT_STATUS_CONFIG[inv.payment_status] || PAYMENT_STATUS_CONFIG.pending;
                  const isOverdue = inv.payment_status === "pending" && inv.due_date < new Date().toISOString().split("T")[0];

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice Number & Source */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-agios-blue hover:underline">
                          {inv.invoice_number}
                        </Link>
                        {inv.creation_source !== "manual" && (
                          <span className="block text-[10px] font-mono text-cyan-600 font-normal">
                            AI &bull; {inv.creation_source}
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.customer_name}</div>
                        {inv.customer_company && (
                          <div className="text-[11px] text-slate-500">{inv.customer_company}</div>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 hidden sm:table-cell font-mono text-slate-600">
                        {inv.due_date}
                        {isOverdue && (
                          <span className="ml-1.5 text-[10px] text-rose-600 font-bold uppercase">Overdue</span>
                        )}
                      </td>

                      {/* 5-State Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusConf.badgeBg}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{statusConf.label}</span>
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-tabular">
                        {formatCents(inv.total_amount_cents)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-4 text-right font-bold font-tabular text-slate-700">
                        {formatCents(inv.balance_due_cents)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/i/${inv.public_token}`}
                            target="_blank"
                            title="Open Client Portal"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            title="Print / PDF View"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/invoices/${inv.id}`}
                            className="p-1.5 text-agios-blue hover:bg-blue-50 rounded"
                            title="Inspect & Simulate Payment State"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
