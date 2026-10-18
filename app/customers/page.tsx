"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Search,
  Building2,
} from "lucide-react";
import { formatCents } from "@/lib/finance/calculator";
import { CustomerRecord } from "@/lib/db";

export default function CustomersPage() {
  const [orgId, setOrgId] = useState("org_apex_01");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCustomers = async (activeOrg: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?orgId=${activeOrg}`);
      const data = await res.json();
      if (data.success && data.customers) {
        setCustomers(data.customers);
      }
    } catch (e) {
      console.error("Failed to load customers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const active = localStorage.getItem("active_org_id") || "org_apex_01";
    setOrgId(active);
    loadCustomers(active);

    const handleOrgChange = (e: any) => {
      if (e.detail?.id) {
        setOrgId(e.detail.id);
        loadCustomers(e.detail.id);
      }
    };
    window.addEventListener("org_changed", handleOrgChange);
    return () => window.removeEventListener("org_changed", handleOrgChange);
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: orgId,
          name,
          company_name: companyName,
          email,
          phone,
          service_address: serviceAddress,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        setCustomers([...customers, data.customer]);
        setAddModalOpen(false);
        setName("");
        setCompanyName("");
        setEmail("");
        setPhone("");
        setServiceAddress("");
        setNotes("");
      }
    } catch (err) {
      console.error("Failed to create customer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company_name && c.company_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-field-border">
        <div>
          <h1 className="text-2xl font-black text-field-text tracking-tight flex items-center gap-2">
            <span>Customer CRM Directory</span>
          </h1>
          <p className="text-xs text-field-muted mt-1">
            Tenant-isolated customer records with lifetime billed and paid metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="touch-target px-4 py-2 rounded-lg bg-agios-blue hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by customer name, company, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-field-border text-xs focus:ring-2 focus:ring-agios-blue/20 bg-white"
        />
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500">
          Loading customer directory...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-field-border p-12 text-center space-y-3">
          <div className="text-slate-400 text-sm">No customers found for this business organization.</div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-agios-blue text-white text-xs font-semibold"
          >
            + Add First Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-field-border p-5 shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    {c.company_name && (
                      <span className="text-xs text-agios-blue font-medium flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>{c.company_name}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    CRM
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.service_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-500 text-[11px] leading-tight">{c.service_address}</span>
                    </div>
                  )}
                </div>

                {c.notes && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic">
                    "{c.notes}"
                  </div>
                )}
              </div>

              {/* Financial Metrics */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Billed</span>
                  <span className="font-bold text-slate-900 font-tabular">{formatCents(c.total_billed_cents)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Paid</span>
                  <span className="font-bold text-emerald-600 font-tabular">{formatCents(c.total_paid_cents)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Customer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add Customer Record</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer / Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vance Logistics LLC"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="(512) 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service / Job Site Address</label>
                <input
                  type="text"
                  placeholder="1234 Commerce St, Austin, TX"
                  value={serviceAddress}
                  onChange={(e) => setServiceAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Gate code, access hours, or job history..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-agios-blue text-white font-bold"
                >
                  {submitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
