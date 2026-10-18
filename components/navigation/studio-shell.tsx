"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Layers,
  Sparkles,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  ChevronDown,
  Building2,
  FileCheck2,
  Mic,
  Activity,
  Zap,
  ClipboardList,
} from "lucide-react";

export interface Org {
  id: string;
  name: string;
  slug: string;
  brand_primary_color: string;
}

const DEFAULT_ORGS: Org[] = [
  { id: "org_5star_01", name: "5 Star plumbing service", slug: "5star-plumbing", brand_primary_color: "#65C466" },
  { id: "org_nova_02", name: "Nova Digital & Design Studio", slug: "nova-digital", brand_primary_color: "#7C3AED" },
  { id: "org_apex_01", name: "Apex Advisory & Consulting", slug: "apex-advisors", brand_primary_color: "#2563EB" },
  { id: "org_summit_02", name: "Summit HVAC & Refrigeration", slug: "summit-hvac", brand_primary_color: "#0284C7" },
  { id: "org_vanguard_03", name: "Vanguard Plumbing & Mechanical", slug: "vanguard-plumbing", brand_primary_color: "#0D9488" },
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeOrg, setActiveOrg] = useState<Org>(DEFAULT_ORGS[0]);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  // Sync active organization with localStorage
  useEffect(() => {
    const saved = localStorage.getItem("active_org_id");
    if (saved) {
      const found = DEFAULT_ORGS.find(o => o.id === saved);
      if (found) setActiveOrg(found);
    }
  }, []);

  const handleSelectOrg = (org: Org) => {
    setActiveOrg(org);
    localStorage.setItem("active_org_id", org.id);
    setOrgDropdownOpen(false);
    // Trigger custom event so page components can react to tenant change
    window.dispatchEvent(new CustomEvent("org_changed", { detail: org }));
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Layers },
    { href: "/estimates", label: "Estimates", icon: ClipboardList },
    { href: "/invoices/new", label: "Invoice Builder", icon: FileText },
    { href: "/ai", label: "Voice & IDP Hub", icon: Mic },
    { href: "/customers", label: "Customer CRM", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/report", label: "Session 1 Report", icon: FileCheck2 },
  ];

  // Don't render the executive shell on the public marketing landing page (/) or client portals (/i/, /e/)
  const isLandingPage = pathname === "/";
  const isPublicPortal = pathname.startsWith("/i/") || pathname.startsWith("/e/");
  if (isLandingPage || isPublicPortal) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-field-canvas">
      {/* =========================================================================
          THE QUIET UNIVERSE: Executive Landing & Navigation Shell
          Obsidian (#07111F) & Slate Navy (#0F172A) with Telemetry Indicators
         ========================================================================= */}
      <header className="bg-agios-obsidian border-b border-agios-obsidian-border text-slate-300 sticky top-0 z-50">
        {/* Telemetry Bar */}
        <div className="px-4 py-1.5 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between text-[11px] font-mono tracking-wider">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-agios-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-agios-cyan animate-pulse"></span>
              AGIOS VENTURE STUDIO &bull; PROTOTYPE LAB
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              DOMAIN: <span className="text-slate-200">invoicepro.agiosventure.com</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hidden md:inline">
              AI: <span className="text-agios-cyan font-semibold">GEMINI-3.8-FLASH</span>
            </span>
            <span className="hidden md:inline">
              STRIPE: <span className="text-emerald-400 font-semibold">ACCOUNTS_V2_DIRECT</span>
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-500/20">
              ISOLATED_DEV
            </span>
          </div>
        </div>

        {/* Main Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="Invoice Pro Agios logo"
                width={36}
                height={36}
                priority
                className="w-9 h-9 rounded-lg object-contain group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-white font-bold text-base leading-tight tracking-tight flex items-center gap-1.5">
                  Invoice Pro <span className="text-agios-cyan font-medium">Agios</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wide">
                  An AGIOS Venture Studio Platform
                </span>
              </div>
            </Link>

            {/* Tenant Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-agios-navy/80 hover:bg-agios-navy border border-agios-obsidian-border text-xs text-white transition-colors"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeOrg.brand_primary_color }}
                />
                <span className="font-medium max-w-[160px] truncate sm:max-w-none">
                  {activeOrg.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {orgDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-agios-navy border border-agios-obsidian-border rounded-lg shadow-2xl py-1 z-50">
                  <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-agios-obsidian-border">
                    Synthetic Contractor Tenants
                  </div>
                  {DEFAULT_ORGS.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSelectOrg(org)}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-xs hover:bg-slate-800 transition-colors ${
                        activeOrg.id === org.id ? "text-white font-semibold bg-slate-800/60" : "text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: org.brand_primary_color }}
                        />
                        <span>{org.name}</span>
                      </div>
                      {activeOrg.id === org.id && (
                        <span className="text-[10px] text-agios-cyan font-mono">ACTIVE</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "text-white bg-slate-800 border border-slate-700/80"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Quick Action */}
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/new"
              className="touch-target px-4 py-2 rounded-lg bg-agios-blue hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-transform active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+ New Invoice</span>
            </Link>
          </div>
        </div>

        {/* Mobile Subnav */}
        <div className="lg:hidden border-t border-agios-obsidian-border bg-agios-navy/90 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap px-3 py-1.5 rounded text-xs flex items-center gap-1.5 ${
                  isActive ? "bg-slate-800 text-white font-semibold" : "text-slate-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Studio Footer */}
      <footer className="border-t border-field-border bg-white text-slate-500 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Invoice Pro Agios</span>
            <span>&bull;</span>
            <span>Session 1 R&D Prototype</span>
            <span>&bull;</span>
            <Link href="https://www.agiosventure.com/" target="_blank" className="text-agios-blue hover:underline">
              AGIOS Venture Studio
            </Link>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>ZERO PRODUCTION DATA</span>
            <span>&bull;</span>
            <span>STRIPE CONNECT V2 SIMULATED</span>
            <span>&bull;</span>
            <span>GEMINI-3.8-FLASH</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
