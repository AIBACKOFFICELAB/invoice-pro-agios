"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Building2,
  Palette,
  CreditCard,
  CheckCircle2,
  DollarSign,
  UploadCloud,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";
import { OrganizationRecord } from "@/lib/db";
import { Segmented } from "@/components/ui/drawer";

export default function SettingsPage() {
  const [orgId, setOrgId] = useState("org_5star_01");
  const [org, setOrg] = useState<OrganizationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [brandColor, setBrandColor] = useState("#65C466");
  const [taxRate, setTaxRate] = useState(0.0);
  const [termsDays, setTermsDays] = useState(14);
  const [defaultFooterMessage, setDefaultFooterMessage] = useState("Thank you for your business!");

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFormat, setLogoFormat] = useState<"framed" | "full">("framed");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadOrg = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/organizations");
      const data = await res.json();
      if (data.success && data.organizations) {
        const found = data.organizations.find((o: OrganizationRecord) => o.id === id);
        if (found) {
          setOrg(found);
          setName(found.name);
          setEmail(found.business_email || "");
          setPhone(found.business_phone || "");
          setAddress(found.business_address || "");
          setBrandColor(found.brand_primary_color || "#65C466");
          setTaxRate(found.default_tax_rate || 0.0);
          setTermsDays(found.default_payment_terms_days || 14);
          setLogoUrl(found.logo_url || null);
          setLogoFormat((found.logo_format as "framed" | "full") || "framed");
          setDefaultFooterMessage(found.default_footer_message || "Thank you for your business!");
        }
      }
    } catch (e) {
      console.error("Failed to load organization settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const active = localStorage.getItem("active_org_id") || "org_5star_01";
    setOrgId(active);
    loadOrg(active);

    const handleOrgChange = (e: any) => {
      if (e.detail?.id) {
        setOrgId(e.detail.id);
        loadOrg(e.detail.id);
      }
    };
    window.addEventListener("org_changed", handleOrgChange);
    return () => window.removeEventListener("org_changed", handleOrgChange);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo file must be smaller than 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(String(reader.result));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/organizations/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orgId,
          name,
          business_email: email,
          business_phone: phone,
          business_address: address,
          brand_primary_color: brandColor,
          default_tax_rate: taxRate,
          default_payment_terms_days: termsDays,
          logo_url: logoUrl,
          logo_format: logoFormat,
          default_footer_message: defaultFooterMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const presetColors = [
    { label: "Signature Green", value: "#65C466" },
    { label: "Royal Blue", value: "#2563EB" },
    { label: "Slate Obsidian", value: "#0F172A" },
    { label: "Violet Purple", value: "#7C3AED" },
    { label: "Teal Emerald", value: "#10B981" },
    { label: "Amber Sun", value: "#D97706" },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-mono text-slate-500">
        Loading business settings...
      </div>
    );
  }

  const monogramInitials = (name || "IP")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="pb-4 border-b border-field-border">
        <h1 className="text-2xl font-black text-field-text tracking-tight flex items-center gap-2">
          <span>Business Branding & Invoicing Studio</span>
        </h1>
        <p className="text-xs text-field-muted mt-1">
          Customize your subscriber business logo, format, accent colors, payment terms, and Stripe Accounts v2 Direct Charge settings.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Branding and settings updated successfully across your public portals and PDFs!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Profile */}
        <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Business Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 5 Star plumbing service"
                className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Support / Billing Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. 5starplumbing05@gmail.com"
                className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. (786) 606-6944"
                className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 4499 NW 82nd Ave, Doral, FL 33166"
                className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Default Footer Message</label>
              <input
                type="text"
                value={defaultFooterMessage}
                onChange={(e) => setDefaultFooterMessage(e.target.value)}
                placeholder="e.g. Thank you for your business!"
                className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Business Logo Studio & Visual Appearance */}
        <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-500" />
            <span>Invoice Appearance & Business Branding Studio</span>
          </h2>

          {/* Live Header Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="uppercase text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                Live Invoice Header Preview
              </span>
              <span>Propagates to Builder, Public Portal & PDF</span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {/* 4px Accent Bar */}
                <div className="h-1 w-full" style={{ backgroundColor: brandColor }}></div>

                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Logo or Monogram Badge */}
                    {logoUrl ? (
                      logoFormat === "framed" ? (
                        <div
                          className="w-14 h-14 rounded-full border border-slate-200 p-1 flex items-center justify-center bg-white shadow-sm shrink-0 overflow-hidden"
                          style={{ borderColor: brandColor }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logoUrl}
                            alt="Business Logo"
                            className="w-full h-full object-contain rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="h-14 max-w-[140px] flex items-center shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logoUrl}
                            alt="Business Logo"
                            className="h-full w-auto object-contain"
                          />
                        </div>
                      )
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm"
                        style={{ backgroundColor: brandColor }}
                      >
                        {monogramInitials}
                      </div>
                    )}

                    <div>
                      <div className="font-black text-base text-slate-900 tracking-tight">
                        {name || "5 Star plumbing service"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {email || "5starplumbing05@gmail.com"} &bull; {phone || "(786) 606-6944"}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right space-y-0.5 font-mono">
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider">INVOICE #5033</div>
                    <div className="text-xs font-bold text-slate-800">Issue date Oct 9, 2026</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Upload & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700">Business Logo</span>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{logoUrl ? "Replace Logo" : "Upload Business Logo"}</span>
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Supports PNG, JPG, WebP, SVG. Reverts to monogram initials when no logo is uploaded.
              </p>
            </div>

            {/* Logo Format Toggle */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700">Logo Display Format</span>
              <Segmented
                value={logoFormat}
                onChange={(f) => setLogoFormat(f as "framed" | "full")}
                options={[
                  { value: "framed", label: "Framed format (Badge)" },
                  { value: "full", label: "Full format (Uncropped)" },
                ]}
              />
              <p className="text-[11px] text-slate-500">
                {logoFormat === "framed"
                  ? "Renders your logo inside a clean rounded badge with an accent ring."
                  : "Renders the full uncropped brand mark across the invoice header."}
              </p>
            </div>
          </div>

          {/* Brand Accent Color */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Brand Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-10 h-10 rounded border border-field-border cursor-pointer p-0.5"
              />
              <span className="font-mono text-xs text-slate-800 uppercase font-bold">{brandColor}</span>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setBrandColor(c.value)}
                    className="px-2.5 py-1 rounded text-xs border border-slate-200 hover:border-slate-400 flex items-center gap-1.5"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.value }}></span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Financial Defaults */}
        <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <span>Financial & Invoicing Defaults</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Payment Terms (Days)</label>
              <input
                type="number"
                value={termsDays}
                onChange={(e) => setTermsDays(parseInt(e.target.value, 10) || 14)}
                className="w-full px-3 py-2 rounded-lg border border-field-border bg-field-canvas font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Stripe Accounts v2 Architecture Status */}
        <div className="bg-gradient-to-br from-agios-obsidian to-agios-navy text-white rounded-xl border border-agios-obsidian-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-agios-cyan" />
              <h2 className="text-sm font-bold font-mono uppercase text-white">
                Stripe Accounts v2 Direct Charge Architecture
              </h2>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              MERCHANT ACTIVE_TEST
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px]">Connected Merchant Account ID:</span>
              <span className="text-agios-cyan font-bold">{org?.stripe_v2_account_id || "acct_test_v2_merchant"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Charge Settlement Mode:</span>
              <span className="text-emerald-400 font-bold">direct_charge</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">SaaS Subscription Status:</span>
              <span className="text-slate-300">{org?.saas_subscription_status || "prototype_eval"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Connect API Version:</span>
              <span className="text-slate-300">2026-02-25.acacia (/v2/core/accounts)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300 leading-relaxed">
            <strong className="text-agios-cyan">Security Principle:</strong> Business secret API keys are never requested, stored, or exposed. Direct Charges settle payments directly into the business's connected merchant account, fully separated from SaaS platform subscriptions.
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="touch-target px-6 py-2.5 rounded-lg bg-agios-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <span>{saving ? "Saving Changes..." : "Save Branding & Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
