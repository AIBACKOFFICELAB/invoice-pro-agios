"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Search,
  ExternalLink,
  Percent,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
  Filter,
} from "lucide-react";
import { formatCents } from "@/lib/math/calculator";

const STATUS_PILLS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "viewed", label: "Viewed" },
  { id: "approved", label: "Approved" },
  { id: "invoiced", label: "Invoiced" },
  { id: "expired", label: "Expired" },
  { id: "declined", label: "Declined" },
];

export default function EstimatesListPage() {
  const [orgId, setOrgId] = useState("org_vanguard_03");
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const loadEstimates = async (org: string, filter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?orgId=${org}&type=estimate&status=${filter}`);
      const data = await res.json();
      if (data.success && data.invoices) {
        setEstimates(data.invoices);
      }
    } catch (e) {
      console.error("Failed to load estimates:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const active = localStorage.getItem("active_org_id") || "org_vanguard_03";
    setOrgId(active);
    loadEstimates(active, activeFilter);

    const onOrgChanged = (e: any) => {
      const newOrgId = e.detail?.id || "org_vanguard_03";
      setOrgId(newOrgId);
      loadEstimates(newOrgId, activeFilter);
    };

    window.addEventListener("org_changed", onOrgChanged);
    return () => window.removeEventListener("org_changed", onOrgChanged);
  }, [activeFilter]);

  const handleConvert = async (id: string) => {
    setConvertingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}/convert`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        loadEstimates(orgId, activeFilter);
      } else {
        alert(data.error || "Conversion failed");
      }
    } finally {
      setConvertingId(null);
    }
  };

  const filteredEstimates = estimates.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.custom_code && e.custom_code.toLowerCase().includes(q)) ||
      (e.project_title && e.project_title.toLowerCase().includes(q)) ||
      (e.customer_name && e.customer_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-field-border">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-agios-blue" />
            <span>Estimates & Proposals</span>
          </h1>
          <p className="text-xs text-field-muted mt-0.5">
            Zero-friction mobile contractor builder &bull; Deposit schedules &bull; Automated 1-click conversion
          </p>
        </div>

        <Link
          href="/estimates/new"
          className="touch-target px-4 py-2 rounded-lg bg-agios-blue hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Estimate</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFilter === pill.id
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search #code, project or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-agios-blue/20"
          />
        </div>
      </div>

      {/* Estimates Table / Cards */}
      <div className="bg-white rounded-xl border border-field-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-slate-400">Loading estimates...</div>
        ) : filteredEstimates.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No estimates found</div>
            <div className="text-xs text-slate-500">
              Create a new estimate or change tenant to explore synthetic contractor proposals.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-field-border bg-slate-50/70 text-field-muted uppercase font-mono text-[11px]">
                  <th className="py-3 px-4">Estimate ID</th>
                  <th className="py-3 px-4">Project / Service Address</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Deposit</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-field-border">
                {filteredEstimates.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link href={`/invoices/${est.id}`} className="hover:text-agios-blue">
                        {est.custom_code || est.invoice_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      <div className="font-semibold text-slate-900">{est.project_title || "General Trade Service"}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Issued: {est.issue_date}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">{est.customer_name}</div>
                      {est.customer_company && (
                        <div className="text-[11px] text-slate-500">{est.customer_company}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          est.document_status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : est.document_status === "invoiced"
                            ? "bg-indigo-100 text-indigo-800"
                            : est.document_status === "expired"
                            ? "bg-rose-100 text-rose-800"
                            : est.document_status === "declined"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {est.document_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCents(est.total_amount_cents)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {est.deposit_enabled === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-semibold">
                          <Percent className="w-3 h-3 text-blue-600" />
                          {formatCents(est.deposit_amount_cents)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/e/${est.public_token}`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-agios-blue"
                          title="Client Portal View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {est.document_status !== "invoiced" && est.document_status !== "declined" && (
                          <button
                            type="button"
                            disabled={convertingId === est.id}
                            onClick={() => handleConvert(est.id)}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition-colors disabled:opacity-50"
                          >
                            {convertingId === est.id ? "Converting..." : "Convert"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
