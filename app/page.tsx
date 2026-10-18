"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  CreditCard,
  FileText,
  ClipboardList,
  ShieldCheck,
  ChevronDown,
  Layers,
  Smartphone,
  Laptop,
  QrCode,
  DollarSign,
  Percent,
  Paperclip,
  Clock,
  Send,
  Building2,
  Calendar,
  Lock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Bot,
  RefreshCw,
  Sliders,
  Check,
  Flame,
  X,
  AlertTriangle,
} from "lucide-react";
import { generateQrSvg } from "@/lib/qr/svg";

export default function PrimeExecutiveLandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"invoice" | "estimate" | "mobile">("invoice");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Founder Beta Modal States
  const [betaModalOpen, setBetaModalOpen] = useState(false);
  const [betaName, setBetaName] = useState("");
  const [betaEmail, setBetaEmail] = useState("");
  const [betaTermsAccepted, setBetaTermsAccepted] = useState(true);
  const [betaSubmitting, setBetaSubmitting] = useState(false);

  // SVG QR Code pointing to the public portal for preview
  const qrSvgSmall = generateQrSvg("https://invoicepro.agiosventure.com/i/tok_5star_5033_shower", 88);
  const qrSvgFooter = generateQrSvg("https://invoicepro.agiosventure.com/dashboard", 110);

  const handleFounderBetaCheckout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBetaSubmitting(true);
    const stripeUrl = process.env.NEXT_PUBLIC_STRIPE_FOUNDER_BETA_URL;
    if (stripeUrl && stripeUrl.startsWith("http")) {
      window.location.href = stripeUrl;
      return;
    }

    // Default simulated / sandbox enrollment
    setTimeout(() => {
      localStorage.setItem("saas_founder_beta_locked", "true");
      localStorage.setItem("saas_founder_beta_rate", "20");
      if (betaEmail) localStorage.setItem("saas_subscriber_email", betaEmail);
      if (betaName) localStorage.setItem("saas_subscriber_name", betaName);
      setBetaSubmitting(false);
      setBetaModalOpen(false);
      router.push("/dashboard?promo=founder_beta_20_locked");
    }, 700);
  };

  const shippedCapabilities = [
    { name: "Executive & Daylight Dashboard", desc: "Dual dark-mode executive telemetry + daylight operational matrix" },
    { name: "Inline Customer Creation Modal", desc: "Instant slide-over search and new customer drawer with zero draft loss" },
    { name: "60-Second Invoice Builder", desc: "Frictionless single-sheet builder with deterministic integer cent math" },
    { name: "Frictionless Estimates Module", desc: "First-class estimates with expiry dates and auto-conversion triggers" },
    { name: "1-Click Estimate Conversion", desc: "Clones line items, attachments & deposits directly into an active invoice" },
    { name: "Flat ($) & Percentage (%) Deposits", desc: "Flexible deposit schedules with independent payment milestones" },
    { name: "Automatic Late Fees (Deposit-Aware)", desc: "Configurable grace periods and percentage or flat overdue fees" },
    { name: "Two-Way File & Photo Attachments", desc: "Both business operators and clients can upload contracts and proof" },
    { name: "Subscriber Business Logo Studio", desc: "Upload custom logos with real-time live preview and monogram fallback" },
    { name: "Framed & Full Logo Formats", desc: "Switch between framed contained badges and edge-to-edge wordmarks" },
    { name: "Public Client Portals (/i/ & /e/)", desc: "Secure tokenized portal with zero client login or password barriers" },
    { name: "Stripe Connect v2 Direct Charges", desc: "Clean merchant architecture keeping SaaS subscriptions isolated" },
    { name: "5-State Payment Status Tracking", desc: "Pending, Processing, Succeeded, Failed, and Refunded state engine" },
    { name: "Automated Reminder Engine", desc: "Rules-based email triggers before due date, on due date, and overdue" },
    { name: "Immutable Invoice Timeline", desc: "Cryptographic event log tracking viewings, transitions, and edits" },
    { name: "Branded PDF Export with QR Code", desc: "4px accent bar, metadata grid, and real scannable QR portal links" },
    { name: "Invoice Duplication & Archiving", desc: "One-click clone from existing invoices and clean ledger archiving" },
    { name: "Additional CC Recipients", desc: "Multiple client and bookkeeper emails attached to notifications" },
    { name: "Multi-Tenant Isolation & Auth", desc: "Clean separation between organizational workspaces and ledger data" },
    { name: "Responsive Mobile & Desktop UX", desc: "Optimized 48px touch targets for phone field use and desktop studios" },
  ];

  const roadmapBets = [
    {
      num: "01",
      title: "Voice-to-Invoice (Gemini 3.8 Flash Live)",
      desc: "Real-time voice extraction parsing audio job notes, parts and labor into structured drafts.",
      tag: "IN PROTOTYPE",
    },
    {
      num: "02",
      title: "Intelligent Document Processing (IDP)",
      desc: "Instant supply receipt OCR converting physical paper invoices into digital line items.",
      tag: "IN PROTOTYPE",
    },
    {
      num: "03",
      title: "AI Follow-Up Collections Agent",
      desc: "Context-aware, empathetic email agents negotiating payment timelines on overdue accounts.",
      tag: "RESEARCH",
    },
    {
      num: "04",
      title: "AI Bookkeeping & Expense Sync",
      desc: "Automatic categorization of accounts receivable into ledger journal entries with receipt matching.",
      tag: "Q1 2027",
    },
    {
      num: "05",
      title: "Mobile Apps (iOS & Android PWA)",
      desc: "Native offline-first mobile companion app with Apple Wallet receipt passes and push alerts.",
      tag: "Q1 2027",
    },
    {
      num: "06",
      title: "Analytics & Aging A/R Reporting",
      desc: "Interactive DSO (Days Sales Outstanding) cohort charts and automated cash-flow projections.",
      tag: "Q2 2027",
    },
    {
      num: "07",
      title: "Recurring Invoices & Retainers",
      desc: "Automated monthly recurring billing schedules for agencies, advisors, and maintenance contracts.",
      tag: "Q2 2027",
    },
    {
      num: "08",
      title: "Multi-User Team Collaboration",
      desc: "Role-based workspace access for owners, managers, team members, and external CPAs.",
      tag: "Q3 2027",
    },
    {
      num: "09",
      title: "Accounting & Webhook Integrations",
      desc: "Bi-directional sync with QuickBooks, Xero, Stripe webhooks, and Zapier automated triggers.",
      tag: "Q3 2027",
    },
  ];

  const faqs = [
    {
      q: "How fast can I create and send my first invoice or estimate?",
      a: "In under 60 seconds. Our single-sheet builder allows you to type or search a customer, add line items with automatic tax and discount calculations, and dispatch a secure client link or branded PDF immediately.",
    },
    {
      q: "Can I use my own business branding and logo?",
      a: "Yes. In the Logo & Appearance Studio (/settings), upload your logo (PNG, JPG, SVG, WebP) and choose between 'Framed Badge' or 'Full Wordmark' formatting. Pick your brand accent color, and all public client portals and PDF exports will automatically render your custom brand identity.",
    },
    {
      q: "How does the Estimate-to-Invoice conversion work?",
      a: "When your client views the estimate portal, they can approve it with one click. Invoice Pro Agios automatically converts the estimate into an active invoice, copies all line items and attachments, applies any deposit credits paid, and anchors new reminder dates.",
    },
    {
      q: "How do deposits, payment schedules, and late fees interact?",
      a: "You can configure a percentage (%) or flat-rate ($) deposit due upon receipt with an independent balance due date. When a client makes a payment, funds apply to the deposit first, then the remaining balance. If an invoice passes its grace period, automated late fees calculate without software glitches.",
    },
    {
      q: "How does Stripe Connect v2 direct charge payout work?",
      a: "Invoice Pro Agios utilizes Stripe Accounts v2 Direct Charge architecture. Payouts from your client credit card, Apple Pay, or ACH transactions route directly into your own verified bank account. SaaS platform fees and merchant receivables remain strictly isolated.",
    },
    {
      q: "Does Invoice Pro Agios work on mobile phones?",
      a: "Yes. Every view—from the operator dashboard and customer creator to the client portal—is engineered with touch targets (48px minimum) and responsive typography for flawless smartphone and tablet usability in the field or on the go.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#04081A] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* =========================================================================
          TOUCHPOINT A: TOP PROMO ANNOUNCEMENT BAR (ABOVE NAVBAR)
         ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 border-b border-blue-500/30 py-2.5 px-4 text-xs">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-400/40">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              FOUNDER BETA PROMO &bull; FIRST 100 SUBSCRIBERS
            </span>
            <span className="text-slate-200 font-medium">
              Lock in <strong>$20/month</strong> (month-to-month) + all live updates while subscribed. Cancel anytime, but canceling forfeits the $20 Founder rate.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBetaModalOpen(true)}
            className="inline-flex items-center gap-1 text-cyan-300 hover:text-white font-bold whitespace-nowrap text-xs underline underline-offset-4 decoration-cyan-400/60 hover:decoration-white transition-all shrink-0"
          >
            <span>Claim 1 of 100 Spots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: STICKY GLASSMORPHIC NAVBAR (Height: 72px)
         ========================================================================= */}
      <header className="sticky top-0 z-40 h-[72px] bg-[#04081A]/85 backdrop-blur-md border-b border-white/[0.08] transition-colors">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          {/* Left: Brand Lockup adhering strictly to 44-52px spec */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <Image
              src="/logo.png"
              alt="Invoice Pro Agios"
              width={48}
              height={48}
              priority
              className="h-11 w-11 object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-lg">
                <span className="text-[#F8FAFC]">INVOICE PRO</span>
                <span className="bg-gradient-to-r from-[#2563EB] to-[#38BDF8] bg-clip-text text-transparent">
                  AGIOS
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400">
                AN AGIOS VENTURE STUDIO PLATFORM
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#estimates-deposits" className="hover:text-white transition-colors">Estimates & Deposits</a>
            <a href="#shipped" className="hover:text-white transition-colors">Live Capabilities</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing & Beta</a>
            <a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <button
              type="button"
              onClick={() => setBetaModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95 border border-cyan-400/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Lock $20/mo Beta</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECTION 2: EXECUTIVE HERO SECTION (Desktop Composition)
         ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:py-24 border-b border-white/[0.06]">
        {/* Ambient Quiet Universe Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left 55% Editorial Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Telemetry Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-cyan-300 text-[11px] font-mono tracking-wider shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AGIOS VENTURE STUDIO &bull; LIVE IN THE APP RIGHT NOW</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Smarter Invoicing & Estimates for{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
                  Modern Businesses.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Create custom-branded estimates and invoices in under 60 seconds. Request percentage or flat-rate deposits, attach files and photos two ways, automate payment reminders and late fees, and get paid online with 1-click Stripe checkout.
              </p>

              {/* TOUCHPOINT B: Hero Lead-Magnet Checkout Button */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBetaModalOpen(true)}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-transform active:scale-95 flex items-center gap-2.5 border border-cyan-300/40"
                  >
                    <Lock className="w-4 h-4 text-cyan-200" />
                    <span>Lock In $20/mo Founder Beta (First 100 Only) &rarr;</span>
                  </button>

                  <Link
                    href="/dashboard"
                    className="px-5 py-3.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm flex items-center gap-2 transition-colors"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>Launch App</span>
                  </Link>

                  <Link
                    href="/invoices/new"
                    className="px-5 py-3.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm flex items-center gap-2 transition-colors"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Try Live Builder</span>
                  </Link>
                </div>

                {/* Urgency Sub-Caption */}
                <p className="text-xs text-cyan-300/90 font-mono tracking-tight leading-relaxed max-w-2xl">
                  &bull; Limited to the first 100 subscribers &bull; $20/mo month-to-month locked while subscribed &bull; Includes all live updates &bull; Canceling forfeits the Founder rate.
                </p>
              </div>

              {/* Social Proof / Trust Proof */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-6 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Deterministic Cent-Math</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Stripe Connect v2 Direct Charges</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Zero Data Lock-in</span>
                </div>
              </div>
            </div>

            {/* Right 45% Interactive Showcase with Client Privacy Blur */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#0F172A] border border-cyan-500/20 shadow-2xl p-5 relative overflow-hidden space-y-4">
                {/* Mockup Tabs */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setActiveTab("invoice")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        activeTab === "invoice" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Invoice #5033
                    </button>
                    <button
                      onClick={() => setActiveTab("estimate")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        activeTab === "estimate" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Estimate #3060
                    </button>
                    <button
                      onClick={() => setActiveTab("mobile")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        activeTab === "mobile" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Mobile Portal
                    </button>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE PREVIEW</span>
                  </div>
                </div>

                {/* Tab 1: Invoice #5033 PDF Preview with Privacy Blur & DOM Redaction */}
                {activeTab === "invoice" && (
                  <div className="bg-white rounded-xl p-5 text-slate-900 text-xs shadow-inner space-y-4 animate-fade-in">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-sm border border-emerald-300">
                          5S
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">5 Star plumbing service</div>
                          <div className="text-[10px] text-slate-500">5starplumbing05@gmail.com &bull; (786) 606-6944</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-slate-900 text-base">#5033</div>
                        <div className="text-[10px] text-slate-500">Oct 9, 2026</div>
                      </div>
                    </div>

                    {/* 4px Brand Accent Bar */}
                    <div className="h-1 w-full bg-[#65C466] rounded-full" />

                    {/* 3-Column Metadata Grid with Privacy Protection */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                      <div>
                        <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
                          <span>Customer</span>
                          <span className="text-[8px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-200 lowercase font-mono">🔒 blurred</span>
                        </div>
                        {/* Redacted and visually blurred client name */}
                        <div className="font-bold text-slate-800 blur-[5px] select-none pointer-events-none opacity-85">
                          Verified Client
                        </div>
                        {/* Redacted and visually blurred address */}
                        <div className="text-[10px] text-slate-500 blur-[5px] select-none pointer-events-none opacity-85">
                          Doral, FL &bull;&bull;&bull;&bull;&bull;
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-400">Project</div>
                        <div className="font-bold text-slate-800 truncate">Shower drain unclogged</div>
                        <div className="text-[10px] text-slate-500">Master Bath</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-400">Payment</div>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Paid in Full
                        </span>
                        {/* Payment Card Last-4 blurred */}
                        <div className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span>MC &bull;&bull;</span>
                          <span className="blur-[5px] select-none pointer-events-none font-mono">8842</span>
                        </div>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[9px]">
                          <tr>
                            <th className="p-2">Description</th>
                            <th className="p-2 text-right">Qty</th>
                            <th className="p-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2">
                              <div className="font-bold text-slate-800">Master bedroom showerdrain unclogged</div>
                              <div className="text-[10px] text-slate-500 italic">Ran 25 ft of snake through shower drain for clearance.</div>
                            </td>
                            <td className="p-2 text-right font-mono">1</td>
                            <td className="p-2 text-right font-mono font-bold">$160.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom: QR Code + Totals */}
                    <div className="flex justify-between items-end pt-1">
                      <div className="flex items-center gap-2.5 p-1.5 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="shrink-0 line-none" dangerouslySetInnerHTML={{ __html: qrSvgSmall }} />
                        <div className="text-[9px] text-slate-600 leading-tight">
                          <strong className="text-slate-900 block">Scan to View & Pay</strong>
                          Instant mobile checkout
                        </div>
                      </div>

                      <div className="text-right space-y-0.5 font-mono text-[11px]">
                        <div className="text-slate-500">Subtotal: $160.00</div>
                        <div className="text-slate-500">Tax (0%): $0.00</div>
                        <div className="font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
                          Total: $160.00
                        </div>
                        <div className="text-emerald-600 font-bold">Paid: -$160.00</div>
                        <div className="text-emerald-700 font-black">Balance: $0.00</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Estimate #3060 Preview with Privacy Blur */}
                {activeTab === "estimate" && (
                  <div className="bg-white rounded-xl p-5 text-slate-900 text-xs shadow-inner space-y-4 animate-fade-in">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 font-extrabold flex items-center justify-center text-sm border border-teal-300">
                          VP
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">Vanguard Plumbing & Mechanical</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span>Service Location:</span>
                            <span className="blur-[5px] select-none pointer-events-none">Miami Beach, FL 33140</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          ESTIMATE #3060
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">Total $3,863.96</div>
                      </div>
                    </div>

                    <div className="h-1 w-full bg-teal-600 rounded-full" />

                    {/* Deposit Schedule Showcase */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-blue-900">Required Deposit</span>
                        <span className="font-mono font-extrabold text-blue-900">$2,913.96 (Due Upon Approval)</span>
                      </div>
                      <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full w-[75%]" />
                      </div>
                      <div className="flex justify-between text-[10px] text-blue-700 font-mono">
                        <span>75% Equipment & Parts Advance</span>
                        <span>$950.00 Remaining Balance</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-800 font-medium">Calentador Bradford White RG275H6N</span>
                        <span className="font-mono font-bold">$1,838.96</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-800 font-medium">Cargo de conveniencia / compra</span>
                        <span className="font-mono font-bold">$125.00</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-800 font-medium">Reemplazo de Water heater (Labor)</span>
                        <span className="font-mono font-bold">$1,900.00</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Pay Deposit ($2,913.96)</span>
                    </button>
                  </div>
                )}

                {/* Tab 3: Mobile 390px Card */}
                {activeTab === "mobile" && (
                  <div className="max-w-[390px] mx-auto bg-slate-900 rounded-2xl p-4 border border-slate-800 text-white text-xs space-y-3.5 shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-mono text-slate-300">SECURE CLIENT PORTAL</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400">1-TAP CHECKOUT</span>
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-bold text-white">Nova Digital Studio</div>
                          <div className="text-[10px] text-slate-400">Invoice #2049 &bull; Brand Sprint</div>
                        </div>
                        <div className="font-mono font-black text-cyan-300 text-sm">$2,450.00</div>
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Deposit received: $1,200.00 &bull; Balance due: <strong className="text-amber-300">$1,250.00</strong>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-colors">
                        <span className="font-sans font-bold">Pay with</span>
                        <span className="font-sans font-black">Apple Pay</span>
                      </button>
                      <button className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay via Credit Card / ACH</span>
                      </button>
                    </div>

                    <div className="text-center text-[10px] text-slate-500 font-mono">
                      Stripe Connect v2 Direct Charge &bull; Encrypted Token Auth
                    </div>
                  </div>
                )}

                <div className="pt-2 text-center text-[11px] font-mono text-slate-400 flex items-center justify-center gap-2">
                  <span>Interactive code-rendered preview</span>
                  <span>&bull;</span>
                  <Link href="/dashboard" className="text-cyan-400 hover:underline">
                    Explore inside Dashboard &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: THE 4 CORE VALUE PILLARS (800x600 Proportions)
         ========================================================================= */}
      <section id="features" className="py-20 lg:py-28 border-b border-white/[0.06] bg-[#07111F]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              ARCHITECTURE & CAPABILITIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Four Core Pillars Built for Operational Velocity
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Eliminate clunky accounting software and single-purpose contractor tools. Invoice Pro Agios is built for modern operators who value speed, precision, and zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pillar 1 */}
            <div className="rounded-2xl bg-[#0F172A] border border-cyan-500/15 p-8 space-y-4 hover:border-cyan-500/40 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center border border-blue-500/30">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Branded Invoices & Estimates in Seconds
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Upload your own business logo (in Framed or Full Wordmark format), pick your primary brand accent color, and generate clean, high-conversion estimates or invoices that elevate your brand reputation with every customer touchpoint.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-cyan-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Live in /settings &bull; Instant PDF & portal sync</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl bg-[#0F172A] border border-cyan-500/15 p-8 space-y-4 hover:border-cyan-500/40 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Paperclip className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Inline CRM & Two-Way File Attachments
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Search or create new customers directly inside the invoice creator without ever losing your draft. Attach contracts, specifications, or photos—and let clients upload their own verification files directly on their portal.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-cyan-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Slide-over drawer &bull; Two-way client file drop</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div id="estimates-deposits" className="rounded-2xl bg-[#0F172A] border border-cyan-500/15 p-8 space-y-4 hover:border-cyan-500/40 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Flexible Deposits, Milestones & Late Fees
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Request flat-rate ($) or percentage (%) deposits with independent due dates, and enforce automatic late fees on overdue balances without software restrictions or math rounding errors.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-cyan-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Automatic payment waterfall &bull; Deposit-aware late fees</span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl bg-[#0F172A] border border-cyan-500/15 p-8 space-y-4 hover:border-cyan-500/40 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Real-Time Cash Flow & Automated Reminders
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Track Pending, Processing, Succeeded, Failed, and Refunded payments across your ledger in real time while automated email reminders follow up on unpaid balances before and after the due date.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-cyan-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Stripe Connect v2 &bull; 5-state payment simulator</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: "LIVE IN THE APP RIGHT NOW" (20 Core Capabilities)
         ========================================================================= */}
      <section id="shipped" className="py-20 lg:py-28 border-b border-white/[0.06] bg-[#04081A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>&bull; SHIPPED & READY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                20 Core Capabilities Live in the Platform
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
            >
              <span>Test in Operator Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shippedCapabilities.map((cap, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#0F172A] border border-white/[0.08] hover:border-cyan-500/30 transition-all space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-white text-xs truncate">{cap.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug pl-6">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: "COMING NEXT — PRODUCT ROADMAP" (9 Next-Gen Bets)
         ========================================================================= */}
      <section id="roadmap" className="py-20 lg:py-28 border-b border-white/[0.06] bg-[#07111F]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400">
              NEXT-GEN PIPELINE
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Coming Next: Product Roadmap
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Our engineering roadmap focuses on autonomous agentic collection workflows, multimodal Gemini 3.8 Flash intelligence, and native accounting integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roadmapBets.map((bet, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-blue-500/40 transition-colors space-y-3 shadow-md relative"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-slate-500">{bet.num}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-cyan-300 border border-blue-800/60">
                    {bet.tag}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm">{bet.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{bet.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: TRANSPARENT SAAS PRICING MATRIX & TOUCHPOINT C: FEATURED FOUNDER BETA
         ========================================================================= */}
      <section id="pricing" className="py-20 lg:py-28 border-b border-white/[0.06] bg-[#04081A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              TRANSPARENT VALUE
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Simple, Predictable SaaS Pricing
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              No artificial waitlists, no seat surprises, and zero lock-in. Choose the Founder Beta allocation or standard tiers below.
            </p>
          </div>

          {/* TOUCHPOINT C: SPOTLIGHT FOUNDER BETA PROMO CARD */}
          <div id="founder-beta-checkout" className="rounded-3xl bg-gradient-to-r from-blue-950/80 via-indigo-950/90 to-blue-950/80 border-2 border-cyan-400/50 p-8 sm:p-10 shadow-2xl shadow-cyan-500/10 relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-cyan-500/20 pb-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-400/50">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>PROMO BETA MODE &bull; LIMITED TO FIRST 100 SUBSCRIBERS</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Founder Beta Pass — Early Adopter Lock
                </h3>
                <p className="text-slate-300 text-sm max-w-2xl">
                  Become 1 of our first 100 platform subscribers. Lock in our lowest lifetime subscription rate of <strong>$20/month</strong> (month-to-month) with all live platform updates included.
                </p>
              </div>

              <div className="flex flex-col sm:items-end justify-center shrink-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">$20</span>
                  <span className="text-slate-400 text-sm font-mono">/month</span>
                  <span className="text-sm line-through text-slate-500 font-mono">$50/mo</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono mt-1">
                  Save 60% every month &bull; Billed month-to-month
                </span>
              </div>
            </div>

            {/* Allocation Progress Bar */}
            <div className="space-y-1.5 max-w-xl">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-cyan-300 font-bold">Founder Beta Allocation</span>
                <span className="text-slate-400">Limited to First 100 Subscribers</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-[42%]" />
              </div>
            </div>

            {/* Terms & Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-200 pt-2">
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Month-to-Month Rate Lock ($20/mo):</strong> Pay just $20/month with zero annual commitment or long-term contract.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Full Pro Platform Access:</strong> Unlimited Invoices & Estimates, Custom Business Logo Studio, % and $ Deposit Schedules, Late Fees, and Two-Way Attachments.</span>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Continuous Live Updates Included:</strong> Automatically receive every new feature, AI release, and speed upgrade at zero extra charge.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Strict Retention Rule:</strong> Your $20/month rate is locked for as long as your subscription remains active. If you cancel, you permanently forfeit the Founder rate (future re-subscription will be at standard $35–$80/mo).</span>
                </div>
              </div>
            </div>

            {/* Checkout CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={() => setBetaModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-cyan-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2 border border-cyan-300/40"
              >
                <span>Claim Your $20/mo Founder Beta Spot &rarr;</span>
              </button>
              <span className="text-xs font-mono text-slate-400">
                🔒 Instant activation &bull; 1-click cancel anytime
              </span>
            </div>
          </div>

          {/* Standard Plans Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
            {/* Solo Tier */}
            <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Solo</h3>
                  <p className="text-xs text-slate-400">For freelancers, solo consultants, and independent operators.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$35</span>
                  <span className="text-xs font-mono text-slate-400">/month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited estimates and invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom subscriber logo & brand color</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Branded PDF export with QR code</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Stripe Connect v2 online payments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Customer CRM with inline creation</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-colors border border-slate-700"
              >
                Start Solo Plan
              </Link>
            </div>

            {/* Pro Tier (Standard) */}
            <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col justify-between space-y-6 relative">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Pro</h3>
                  <p className="text-xs text-slate-400">Standard rate for growing businesses and agencies.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$50</span>
                  <span className="text-xs font-mono text-slate-400">/month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Everything in Solo, plus:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Percentage (%) and flat ($) deposits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automated late fee enforcement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Two-way file and photo attachments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automated email payment reminders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Gemini 3.8 Flash Voice & IDP Studio</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setBetaModalOpen(true)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition-colors"
              >
                Choose Pro (or $20 Founder)
              </button>
            </div>

            {/* Team Tier */}
            <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Team</h3>
                  <p className="text-xs text-slate-400">For multi-operator firms, advisory studios, and staff dispatchers.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$80</span>
                  <span className="text-xs font-mono text-slate-400">/month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Everything in Pro, plus:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-user permissions (Owner/Member)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Shared organizational customer CRM</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Priority concierge onboarding & chat</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct accounting webhook exports</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-colors border border-slate-700"
              >
                Contact for Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: FAQ ACCORDION & FOOTER WITH MOBILE QR CODE
         ========================================================================= */}
      <section id="faq" className="py-20 lg:py-28 border-b border-white/[0.06] bg-[#07111F]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              QUESTIONS & ANSWERS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#0F172A] border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-cyan-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#04081A] text-slate-400 text-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-12 border-b border-white/[0.08]">
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Invoice Pro Agios"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
                <div className="font-bold tracking-tight text-base text-white">
                  INVOICE PRO <span className="text-cyan-400">AGIOS</span>
                </div>
              </div>
              <p className="text-slate-400 max-w-xl text-xs leading-relaxed">
                An official platform developed within{" "}
                <Link
                  href="https://www.agiosventure.com/"
                  target="_blank"
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  AGIOS Venture Studio
                </Link>
                . Delivering intelligent financial infrastructure, deterministic cent-math calculation engines, and frictionless payment portals.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-2">
                <Link href="/dashboard" className="hover:text-white transition-colors">Operator Dashboard</Link>
                <span>&bull;</span>
                <Link href="/invoices/new" className="hover:text-white transition-colors">Create Invoice</Link>
                <span>&bull;</span>
                <Link href="/estimates" className="hover:text-white transition-colors">Estimates</Link>
                <span>&bull;</span>
                <Link href="/settings" className="hover:text-white transition-colors">Branding & Logo Studio</Link>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => setBetaModalOpen(true)}
                  className="text-cyan-300 hover:text-white font-bold transition-colors"
                >
                  Founder Beta ($20/mo)
                </button>
                <span>&bull;</span>
                <Link href="https://www.agiosventure.com/" target="_blank" className="hover:text-white transition-colors">
                  AGIOS Venture Studio &rarr;
                </Link>
              </div>
            </div>

            {/* Scannable Mobile QR Card */}
            <div className="md:col-span-4 flex justify-start md:justify-end">
              <div className="p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/20 flex items-center gap-4 shadow-xl">
                <div className="shrink-0 line-none" dangerouslySetInnerHTML={{ __html: qrSvgFooter }} />
                <div className="space-y-1">
                  <div className="text-white font-bold text-xs">Scan to Open on Phone</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Experience the mobile-responsive operator & client portals on your device.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
            <div>&copy; {new Date().getFullYear()} AGIOS Venture Studio. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Deterministic Cent-Math</span>
              <span>&bull;</span>
              <span>Stripe Connect v2</span>
              <span>&bull;</span>
              <span>Next.js 15.5</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          TOUCHPOINT D: FOUNDER BETA CHECKOUT MODAL ($20/MO LOCK)
         ========================================================================= */}
      {betaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0A1224] border border-cyan-400/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setBetaModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-2 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-400/50">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>FIRST 100 FOUNDER ALLOCATION</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Lock In Your $20/mo Founder Beta Pass
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unlock full platform access (Invoices, Estimates, Deposits, Late Fees, Custom Branding & Stripe payments) at $20/month locked for life while subscribed.
              </p>
            </div>

            {/* Plan Summary Box */}
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Invoice Pro Agios — Founder Beta</span>
                <span className="font-mono font-black text-cyan-300 text-sm">$20.00 / month</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Billed month-to-month &bull; Continuous live updates included &bull; Cancel anytime
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFounderBetaCheckout} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-slate-300 mb-1.5">
                  Business or Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Studio or Sarah Jenkins"
                  value={betaName}
                  onChange={(e) => setBetaName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-slate-300 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="billing@yourbusiness.com"
                  value={betaEmail}
                  onChange={(e) => setBetaEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Strict Retention Acknowledgment */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="beta-terms"
                  checked={betaTermsAccepted}
                  onChange={(e) => setBetaTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400/50 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
                />
                <label htmlFor="beta-terms" className="text-[11px] leading-tight select-none cursor-pointer">
                  I understand my <strong>$20/mo rate and live updates</strong> are locked for as long as I remain subscribed, and canceling forfeits the Founder Beta rate.
                </label>
              </div>

              <button
                type="submit"
                disabled={!betaTermsAccepted || betaSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 border border-cyan-300/40"
              >
                <span>{betaSubmitting ? "Activating Founder Pass..." : "Proceed to $20/mo Founder Checkout →"}</span>
              </button>

              <div className="text-center text-[10px] text-slate-500 font-mono">
                🔒 Secured by Stripe Connect v2 &bull; Direct Checkout Rails
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
