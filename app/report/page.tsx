"use client";

import React from "react";
import Link from "next/link";
import {
  FileCheck2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Code2,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  Printer,
} from "lucide-react";

export default function EngineeringReportPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-field-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Session 1 Deliverable Complete</span>
          </div>
          <h1 className="text-3xl font-black text-field-text tracking-tight">
            Session 1 Engineering Report
          </h1>
          <p className="text-xs text-field-muted mt-1">
            Invoice Pro Agios &bull; Independent R&D Prototype &bull; AGIOS Venture Studio
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="touch-target px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-slate-800">
        {/* =====================================================================
            PART 1: WHAT FUNCTIONALITY WAS IMPLEMENTED
           ===================================================================== */}
        <section className="bg-white rounded-xl border border-field-border p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-agios-blue text-white flex items-center justify-center font-mono font-bold text-xs">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900">Functionality Implemented</h2>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <strong>Multi-Tenant Architecture & Synthetic Tenant Switching:</strong> Embedded schema with organization scoping (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">organization_id</code>), role-based tenant switcher across 3 realistic contractor accounts (Apex Electrical Solutions, Summit HVAC & Refrigeration, Vanguard Plumbing & Mechanical), and custom branding settings.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <strong>Field Contractor Dashboard & Customer CRM:</strong> Real-time KPI summaries (Collected Revenue, Pending/Processing Volume, Overdue Balance, Average Settlement Time), 5-state filterable invoice ledger, and customer directory with job history and lifetime billed/paid totals.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <strong>Deterministic Invoice Builder & Cent-Math:</strong> Dynamic line item creator where line totals (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">ROUND(quantity * unit_price_cents)</code>), subtotals, tax amounts, and balances are calculated strictly in integer cents with zero floating-point drift.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <strong>Gemini 3.8 Flash Zero-Hallucination AI Routes:</strong> Implemented <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">POST /api/ai/voice-to-invoice</code> and <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">POST /api/ai/idp-extract</code> with Zod validation, missing field warnings, and a mandatory contractor confirmation gate before staging into active invoices.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <strong>Stripe Accounts v2 5-State Payment Machine:</strong> Architecture blueprint around <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/v2/core/accounts</code> with Direct Charges. Interactive state machine simulator demonstrating all 5 states: <span className="font-mono text-amber-600 font-semibold">pending</span>, <span className="font-mono text-blue-600 font-semibold">processing</span>, <span className="font-mono text-emerald-600 font-semibold">succeeded</span>, <span className="font-mono text-rose-600 font-semibold">failed</span>, and <span className="font-mono text-slate-600 font-semibold">refunded</span>.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <strong>Public Client Invoice Portal & Print/PDF Export:</strong> Tokenized view (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/i/[token]</code>) with contractor logo, branding accent, QR code, simulated client payment checkout, and print-ready PDF styling (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/api/invoices/[id]/pdf</code>).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <strong>Immutable Audit Log & Event Timeline:</strong> Every invoice creation, edit, AI confirmation, and payment status transition is immutably recorded in the <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">invoice_events</code> table.
              </div>
            </li>
          </ul>
        </section>

        {/* =====================================================================
            PART 2: WHAT IS MOCKED VERSUS ACTUALLY INTEGRATED
           ===================================================================== */}
        <section className="bg-white rounded-xl border border-field-border p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-agios-blue text-white flex items-center justify-center font-mono font-bold text-xs">
              2
            </span>
            <h2 className="text-base font-bold text-slate-900">Mocked vs. Integrated Boundary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 font-mono uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fully Integrated Locally</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-emerald-950">
                <li>Deterministic cent-math calculator</li>
                <li>SQLite embedded engine (<code className="font-mono">node:sqlite</code>)</li>
                <li>Full CRUD for orgs, customers, invoices, items, and events</li>
                <li>Stripe v2 5-state payment transition engine</li>
                <li>Zod schema zero-hallucination validation</li>
                <li>Live Gemini API call (when API key provided)</li>
                <li>Token-based public invoice page & print PDF engine</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 font-mono uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Simulated in Session 1</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-950">
                <li>Stripe Accounts v2 onboarding (simulated account IDs)</li>
                <li>Card/ACH money movement (simulated checkout triggers)</li>
                <li>Stripe webhook listener (simulated webhook event triggers)</li>
                <li>Outbound emails (<code className="font-mono">sandbox_log_only</code> mode)</li>
                <li>Gemini fallback parser (runs when no API key configured)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* =====================================================================
            PART 3: TESTS PERFORMED AND RESULTS
           ===================================================================== */}
        <section className="bg-white rounded-xl border border-field-border p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-agios-blue text-white flex items-center justify-center font-mono font-bold text-xs">
              3
            </span>
            <h2 className="text-base font-bold text-slate-900">Tests Performed & Verification Results</h2>
          </div>

          <div className="p-4 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>TEST SUITE: tests/finance-and-state-machine.test.mjs</span>
              <span className="text-emerald-400 font-bold">ALL PASS (4/4)</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="text-emerald-400">✔ Deterministic Cent Math: line items calculate rounded integer cents</div>
              <div className="text-emerald-400">✔ Deterministic Cent Math: subtotal, discount, tax, total, balance due</div>
              <div className="text-emerald-400">✔ Stripe Connect v2 5-State Machine: valid state transitions</div>
              <div className="text-emerald-400">✔ Stripe Connect v2 5-State Machine: illegal transitions prevented</div>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed">
            All unit tests executed synchronously using Node.js built-in test runner (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">node --test</code>). Verified clean integer cents calculation without floating point inaccuracy and enforced strict state transition restrictions (e.g. refunded is terminal).
          </div>
        </section>

        {/* =====================================================================
            PART 4: ENVIRONMENT VARIABLES REQUIRED
           ===================================================================== */}
        <section className="bg-white rounded-xl border border-field-border p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-agios-blue text-white flex items-center justify-center font-mono font-bold text-xs">
              4
            </span>
            <h2 className="text-base font-bold text-slate-900">Environment Variables Required (.env.example)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-field-border text-slate-400 uppercase text-[10px]">
                  <th className="py-2">Variable</th>
                  <th className="py-2">Session 1 Default</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 text-agios-blue font-bold">NEXT_PUBLIC_APP_NAME</td>
                  <td className="py-2">"Invoice Pro Agios"</td>
                  <td className="py-2 text-slate-600">Application branding identity</td>
                </tr>
                <tr>
                  <td className="py-2 text-agios-blue font-bold">NEXT_PUBLIC_PREFERRED_DOMAIN</td>
                  <td className="py-2">"invoicepro.agiosventure.com"</td>
                  <td className="py-2 text-slate-600">Reserved studio subdomain</td>
                </tr>
                <tr>
                  <td className="py-2 text-agios-blue font-bold">GEMINI_MODEL</td>
                  <td className="py-2">"gemini-3.8-flash"</td>
                  <td className="py-2 text-slate-600">Primary server-side AI model</td>
                </tr>
                <tr>
                  <td className="py-2 text-agios-blue font-bold">GEMINI_API_KEY</td>
                  <td className="py-2">optional in preview</td>
                  <td className="py-2 text-slate-600">Google Gemini API key (server only)</td>
                </tr>
                <tr>
                  <td className="py-2 text-agios-blue font-bold">PAYMENT_EXECUTION_MODE</td>
                  <td className="py-2">"simulated"</td>
                  <td className="py-2 text-slate-600">Enforces simulated Stripe direct charges</td>
                </tr>
                <tr>
                  <td className="py-2 text-agios-blue font-bold">STRIPE_CONNECT_API_VERSION</td>
                  <td className="py-2">"2026-02-25.acacia"</td>
                  <td className="py-2 text-slate-600">Supports Stripe Accounts v2</td>
                </tr>
                <tr>
                  <td className="py-2 text-agios-blue font-bold">EMAIL_DELIVERY_MODE</td>
                  <td className="py-2">"sandbox_log_only"</td>
                  <td className="py-2 text-slate-600">Prevents real email dispatches</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* =====================================================================
            PART 5: ARCHITECTURE & SECURITY DECISIONS
           ===================================================================== */}
        <section className="bg-white rounded-xl border border-field-border p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-agios-blue text-white flex items-center justify-center font-mono font-bold text-xs">
              5
            </span>
            <h2 className="text-base font-bold text-slate-900">Architecture & Security Decisions</h2>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div>
              <strong className="text-slate-900 block mb-0.5">1. Zero Secret Key Storage:</strong>
              Contractor secret Stripe API keys are never requested, stored, or exposed. In Stripe Accounts v2, direct charges are authorized server-side referencing the merchant account ID (<code className="font-mono">acct_...</code>).
            </div>
            <div>
              <strong className="text-slate-900 block mb-0.5">2. Separation of Billing Flows:</strong>
              SaaS Platform Subscription Billing (Contractor &rarr; AGIOS Platform) is kept strictly isolated in the data model from Contractor Invoice Payments (Customer &rarr; Contractor Connected Account).
            </div>
            <div>
              <strong className="text-slate-900 block mb-0.5">3. Zero-Hallucination Guardrails:</strong>
              The AI extraction engine never fabricates missing quantities, unit prices, tax rates, or customer info. Unstated fields evaluate to <code className="font-mono">null</code>, trigger explicit UI warnings, and require a mandatory contractor confirmation checkbox before staging.
            </div>
            <div>
              <strong className="text-slate-900 block mb-0.5">4. Immutable Event Audit Trail:</strong>
              All document lifecycle updates, AI extraction verifications, and payment status transitions write to <code className="font-mono">invoice_events</code> with actor metadata and timestamps.
            </div>
          </div>
        </section>

        {/* =====================================================================
            PART 6: KNOWN LIMITATIONS & OUTSTANDING RISKS
           ===================================================================== */}
        <section className="bg-white rounded-xl border border-field-border p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-agios-blue text-white flex items-center justify-center font-mono font-bold text-xs">
              6
            </span>
            <h2 className="text-base font-bold text-slate-900">Known Limitations & Outstanding Risks</h2>
          </div>

          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">&bull;</span>
              <span><strong>Session 1 Prototype Boundary:</strong> Designed exclusively as an R&D prototype. Not configured for production traffic or live banking rails.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">&bull;</span>
              <span><strong>Live Webhook Ingestion:</strong> Session 1 uses simulated triggers; Session 2 will integrate a live Stripe webhook listener verifying signatures against <code className="font-mono">STRIPE_WEBHOOK_SECRET</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">&bull;</span>
              <span><strong>Supabase Cloud Synchronization:</strong> Currently uses local SQLite engine matching the exact PostgreSQL schema. Production deployment will require applying <code className="font-mono">schema.sql</code> to an isolated Supabase project.</span>
            </li>
          </ul>
        </section>

        {/* =====================================================================
            PART 7: INSTRUCTIONS FOR USABLE LOCAL CONTRACTOR WORKFLOW
           ===================================================================== */}
        <section className="bg-white rounded-xl border border-field-border p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-agios-blue text-white flex items-center justify-center font-mono font-bold text-xs">
              7
            </span>
            <h2 className="text-base font-bold text-slate-900">Usable Local/Preview Contractor Workflow</h2>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <p>Follow these steps to evaluate the prototype locally:</p>

            <ol className="list-decimal list-inside space-y-2 font-mono text-[11px] bg-slate-50 p-4 rounded-lg border border-slate-200">
              <li>Open <Link href="/dashboard" className="text-agios-blue underline font-bold">Field Dashboard</Link> to inspect real-time collected revenue, overdue balances, and 5-state invoice ledger.</li>
              <li>Use the <strong>Tenant Switcher</strong> in the top header to switch between Apex Electrical, Summit HVAC, and Vanguard Plumbing.</li>
              <li>Click <strong>+ New Invoice</strong> or open <Link href="/ai" className="text-agios-blue underline font-bold">Voice & IDP Studio</Link> to test zero-hallucination extraction.</li>
              <li>Review missing fields warnings, check the <strong>Mandatory Confirmation Gate</strong>, and apply fields to the builder.</li>
              <li>Publish the invoice to generate a unique public token (<code className="bg-slate-200 px-1 rounded">/i/[token]</code>).</li>
              <li>Open the public client view or simulate payment transitions (<code className="bg-slate-200 px-1 rounded">pending &rarr; processing &rarr; succeeded &rarr; refunded</code>).</li>
              <li>Click <strong>Print / PDF</strong> to verify print-ready document styling.</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
