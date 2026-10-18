# SYSTEM DIRECTIVE: Invoice Pro Agios — Session 1 Experimental SaaS Prototype

## 1. Project Identity & Strict Isolation Boundary
You are building **Invoice Pro Agios**, an independent R&D / experimental invoicing and accounts receivable SaaS prototype created within **AGIOS Venture Studio** (https://www.agiosventure.com/).
- **CRITICAL ISOLATION RULE:** This is NOT an authorized replacement for Invoice Pilot Pro. Do NOT connect to, modify, or reuse any existing Production databases, Stripe accounts, API credentials, GitHub repositories, customer records, domains, or deployment configurations.
- Build inside a completely isolated workspace using synthetic demonstration data only.
- Do NOT implement enrollment limits, waitlists, onboarding application forms, or the legacy 20-member Founder Beta pricing.
- Do NOT purchase domains, modify DNS, send real emails/SMS, or trigger live financial transactions. Keep all domain references (`invoicepro.agiosventure.com`) driven by environment variables.

## 2. Brand & UX/UI Design System ("AGIOS Quiet Universe + Daylight Field Matrix")
Deliver a premium AGIOS Venture Studio user experience across two cohesive surfaces:
1. **Executive Landing & Navigation Shell ("The Quiet Universe"):** Deep-space obsidian (`#07111F`) and slate navy (`#0F172A`) surfaces, restrained royal blue (`#2563EB`) and telemetry cyan (`#38BDF8`) highlights, crisp 1px borders, monospace system telemetry indicators, and clean editorial typography.
2. **Contractor Workspace & Public Invoice Portal ("Daylight Field Matrix"):** High-contrast light/dark adaptive interface (`#F8FAFC` daylight canvas, `#E2E8F0` borders) engineered for outdoor readability on mobile phones, with minimum `48px` touch targets, zero fragile animations, and scannable financial tables.

## 3. Core Functional Scope for Session 1
Implement and clearly distinguish between integrated local functionality and simulated external integrations:
1. **Multi-Tenant Isolation & Auth Boundary:** Organization-scoped data model (`organization_id`) with tenant switching across synthetic contractor accounts, role-based structure (`owner`, `admin`, `field_tech`, `bookkeeper`), company branding settings, and logo upload preview.
2. **Responsive Dashboard & Customer CRM:** Real-time KPI summary cards (Collected Revenue, Pending/Processing Volume, Overdue Balance, Average Settlement Time), filterable invoice ledger, and customer directory with job history and lifetime billed/paid totals.
3. **Deterministic Invoice Builder & Live Timeline:** Fast invoice creation and editing where all line totals (`ROUND(quantity * unit_price_cents)`), subtotals, discounts, tax amounts, and balances are computed deterministically in TypeScript/SQL using integer cents. Log every creation, edit, AI extraction, and payment state transition into an immutable **Invoice Timeline** (`invoice_events`).
4. **Public Invoice Page & Branded PDF Export:** Shareable token-based client view (`/i/[token]`) with company logo, brand accent color, itemized breakdown, QR code, and print-ready PDF export (`/api/invoices/[id]/pdf`).
5. **Stripe Connect v2 Architecture & 5-State Payment Flow:**
   - Architect for future multi-tenant **Stripe Accounts v2 (`/v2/core/accounts`) with `merchant` configuration and Direct Charges**, keeping SaaS platform subscription billing strictly separate from contractor invoice payments.
   - Never request, store, or expose contractor secret API keys.
   - For Session 1, run in **Simulated Mode** or **Isolated Stripe Test Mode** only.
   - Enforce and demonstrate all 5 distinct payment states on invoices: `pending`, `processing`, `succeeded`, `failed`, and `refunded`.
6. **Gemini 3.8 Flash AI Extraction Routes:**
   - `POST /api/ai/voice-to-invoice` — Extracts structured customer, due date, and line item data from spoken contractor instructions.
   - `POST /api/ai/idp-extract` — Extracts structured vendor/customer, service, quantity, and pricing data from uploaded job documents or supply receipts.
   - Configure the model via server-side environment variable (`GEMINI_MODEL=gemini-3.8-flash`, `GEMINI_API_KEY`). Never expose keys to the client.
   - **Zero-Hallucination & Confirmation Gate:** Never invent missing prices, quantities, tax rates, customer details, or payment terms—return `null` for any unstated field, highlight missing fields in the UI, and require an explicit contractor confirmation checkbox before importing AI fields into an active invoice.

## 4. Required Session 1 Engineering Report
Upon completing the build, output a structured 7-part report covering:
1. What functionality was implemented.
2. What is mocked versus actually integrated.
3. Any tests performed and their results.
4. Environment variables required (matching `.env.example`).
5. Architecture and security decisions.
6. Known limitations and outstanding risks.
7. Instructions for the usable local/preview contractor workflow.
