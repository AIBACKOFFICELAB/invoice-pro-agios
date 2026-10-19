# Invoice Pro Agios

> **An AGIOS Venture Studio Platform**  
> Modern Invoicing, Intelligent Estimates, Deposit Milestones & Automated Accounts Receivable  
> Domain: [invoicepro.agiosventure.com](https://invoicepro.agiosventure.com) &bull; Studio: [agiosventure.com](https://www.agiosventure.com)

---

## 1. Executive Summary & Brand Positioning

**Invoice Pro Agios** is a universal accounts receivable and billing engine built by **AGIOS Venture Studio**. Engineered for **freelancers, independent consultants, design & tech agencies, and modern service operators**, Invoice Pro Agios replaces outdated legacy contractor tools and clunky small-business software with an institutional, frictionless financial operations system.

The application combines:
- **Universal SaaS Workflow:** Eliminates trade-only constraints, welcoming solo practitioners up to high-volume commercial agencies.
- **Deterministic Cent-Math Engine:** Zero IEEE-754 floating point drift—all currency calculations (subtotals, discounts, sales taxes, deposit splits, and late fees) execute with rounded integer cents.
- **Stripe Accounts v2 Direct Charge Architecture:** Direct merchant rails separating platform SaaS subscriptions from operator customer settlements.
- **Multimodal AI Studio:** Gemini 3.8 Flash voice-to-invoice transcription and Intelligent Document Processing (IDP) receipt ingestion.
- **AGIOS Quiet Universe Design System:** High-authority dark obsidian executive shell paired with daylight operational interfaces, responsive touch ergonomics, and branded PDF generation.

---

## 2. Next.js 15 App Router Architecture

Invoice Pro Agios is built on **Next.js 15** (React 19) using the App Router directory structure:

```
invoice-pro-agios/
├── app/
│   ├── page.tsx                           # Prime Executive Landing Page ("Quiet Universe" edition)
│   ├── layout.tsx                         # Global layout, OG metadata, and universal CSS linkage
│   ├── globals.css                        # Tailwind base styles and tabular numeral typography
│   ├── dashboard/page.tsx                 # Operator Dashboard & Accounts Receivable Matrix
│   ├── estimates/
│   │   ├── page.tsx                       # Estimates overview & status filtering
│   │   └── new/page.tsx                   # Single-sheet estimate creator
│   ├── invoices/
│   │   ├── new/page.tsx                   # Single-sheet invoice creator with inline customer drawer
│   │   └── [id]/page.tsx                  # Invoice detail, ••• action menu, timeline, & Stripe simulator
│   ├── customers/page.tsx                 # Customer CRM & client ledger
│   ├── settings/page.tsx                  # Subscriber Business Logo Studio & Appearance
│   ├── ai/page.tsx                        # Gemini 3.8 Flash Voice & IDP Studio
│   ├── report/page.tsx                    # Platform specifications & release auditing
│   ├── i/[token]/page.tsx                 # Public tokenized client invoice portal
│   ├── e/[token]/page.tsx                 # Public tokenized client estimate portal
│   └── api/
│       ├── invoices/                      # Invoicing CRUD & KPI aggregations
│       │   ├── [id]/pdf/route.ts          # Invoice #5033 PDF layout with vector QR code
│       │   ├── [id]/duplicate/route.ts    # 1-click invoice duplication
│       │   ├── [id]/convert/route.ts      # 1-click estimate-to-invoice conversion
│       │   ├── [id]/transition/route.ts   # Stripe Accounts v2 5-state payment machine
│       │   ├── [id]/late-fee/route.ts     # Automatic late fee application
│       │   └── [id]/attachments/route.ts # Two-way attachment handlers
│       ├── customers/route.ts             # Customer search & inline creation endpoint
│       ├── organizations/                 # Multi-tenant organization queries
│       │   └── branding/route.ts          # Business logo, format, & color persistence
│       ├── public/[token]/route.ts        # Client portal token resolution & payment actions
│       ├── ai/
│       │   ├── voice-to-invoice/route.ts  # Voice memo extraction via Gemini 3.8 Flash
│       │   └── idp-extract/route.ts       # Receipt OCR extraction via Gemini 3.8 Flash
│       └── reminders/run/route.ts         # Scheduled email reminder runner
├── components/
│   ├── navigation/studio-shell.tsx        # Top executive bar, brand lockup, & tenant switcher
│   ├── document-builder.tsx               # Unified single-sheet estimate & invoice builder
│   ├── document-session2-panel.tsx        # In-context deposits, attachments, & late fee controls
│   ├── public-document.tsx                # Client portal document viewer with 1-tap checkout
│   ├── attachments.tsx                    # Two-way client/contractor file uploader
│   └── ui/drawer.tsx                      # Slide-over drawers, segmented pills, & toggle switches
├── lib/
│   ├── db/
│   │   ├── index.ts                       # Node.js SQLite persistence & query operations
│   │   ├── session2.ts                    # Idempotent schema migrations & synthetic tenant seeds
│   │   └── documents.ts                   # Universal document factory & calculation bindings
│   ├── math/
│   │   └── calculator.ts                  # Pure deterministic cent-math calculation suite
│   ├── stripe/
│   │   └── connect-v2-architecture.ts     # 5-state payment lifecycle & Stripe v2 configuration
│   ├── qr/
│   │   └── svg.ts                         # Pure TypeScript vector SVG QR code generator
│   └── validators/
│       └── ai-extraction.ts               # Zod schemas for Gemini structured outputs
├── tests/
│   └── finance-and-state-machine.test.mjs # 10/10 automated node:test verification suite
└── public/
    ├── logo.png                           # Transparent stylized 'P' emblem brand asset
    └── tailwind.css                       # Compiled, minified Tailwind production utility suite
```

---

## 3. The 20+ Shipped Platform Capabilities

1. **Executive & Daylight Dashboard:** Dual-mode workspace combining an obsidian executive telemetry bar with a daylight high-contrast field ledger.
2. **Inline Customer Creation Modal:** Search existing customers with avatar initials (`TR`, `SE`, `EV`) or create new clients on the fly with zero draft loss.
3. **60-Second Document Builder:** Single-sheet responsive builder for line items, custom codes, notes, tax rates, and discounts.
4. **First-Class Estimates Module:** Dedicated `/estimates` tracking draft, sent, viewed, approved, and invoiced states.
5. **1-Click Estimate Conversion:** Automatically converts approved estimates into active invoices while cloning line items, deposit credits, and attachments.
6. **Flat (`$`) & Percentage (`%`) Deposits:** Configure initial milestones due upon receipt with independent balance due dates.
7. **Automatic Deposit Payment Waterfall:** Applies incoming funds to the deposit requirement first before reducing the remaining balance.
8. **Automatic Late Fees (Deposit-Aware):** Enforce flat or percentage overdue fees after customizable grace periods.
9. **Two-Way File & Photo Attachments:** Operators can attach scope specifications and photos; clients can upload confirmation proof directly on the portal.
10. **Subscriber Business Logo Studio (`/settings`):** Upload PNG, JPG, SVG, or WebP assets with instant live preview.
11. **Framed vs. Full Wordmark Formats:** Switch between framed badges and wide banner logo orientations.
12. **Monogram Initial Fallback:** High-contrast two-letter initials rendered on the subscriber's brand color when no custom logo is uploaded.
13. **Brand Accent Color Studio:** Custom HEX selection with quick presets (Emerald, Royal Blue, Violet, Teal, Slate).
14. **Public Tokenized Client Portals (`/i/[token]` & `/e/[token]`):** Zero-friction public portals requiring no client login or passwords.
15. **Stripe Connect v2 Direct Charges:** Simulated and live-ready Stripe Accounts v2 (`/v2/core/accounts`) merchant architecture.
16. **5-State Payment Machine:** Strictly governed transitions between `Pending`, `Processing`, `Succeeded`, `Failed`, and `Refunded`.
17. **Automated Reminder Engine:** Rules-based email triggers scheduled before due dates, on due dates, and post-due-date overdue intervals.
18. **Immutable Cryptographic Audit Trail:** Event timeline logging creation, client views, status transitions, and payments.
19. **Branded Invoice #5033 PDF & Print Export:** 4px subscriber accent bar, 3-column metadata grid, italicized service notes, and scannable QR code.
20. **Standalone Vector QR Code Generator:** Zero external canvas binary dependencies; generates pure SVG QR codes encoding client portal URLs.
21. **Invoice Duplication & Archiving:** One-click cloning from existing invoices and clean ledger archiving.
22. **Additional CC Recipients:** Send notifications and receipts to multiple stakeholders or bookkeepers.
23. **Multi-Tenant Workspace Switcher:** Seamless switching between synthetic business organizations.
24. **Founder Beta Lead Magnet:** High-converting `$20/month` First-100 subscribers promotion with privacy-blurred client demos.

---

## 4. Invoice #5033 Layout & Vector QR Engine

The PDF route (`/api/invoices/[id]/pdf`) and public client portals mirror the reference **Invoice #5033** specification:

- **Header Section:** Dynamic subscriber business logo (`framed` badge vs. `full` wordmark) + Business contact details alongside Invoice/Estimate number and issue date.
- **4px Full-Width Accent Bar:** Rendered in the subscriber's custom `brand_primary_color`.
- **Project Hero & Message:** Displays project title (e.g., *"Shower drain unclogged"*) and customizable client greetings.
- **3-Column Metadata Grid:** Structured cards for **Customer**, **Invoice Details**, and **Payment Details** (including payment method such as `Mastercard 3221`).
- **Itemized Service Matrix:** Line item breakdown supporting italicized operator notes (*"Ran 25 ft of snake through shower drain for clearance."*).
- **Payment & Totals Waterfall:** Subtotal, discount credits, tax amounts, late fees, total billed, amount paid, and net balance due.
- **Embedded Vector QR Code:** Pure TypeScript generator in `lib/qr/svg.ts` generating crisp SVG QR codes pointing directly to `/i/[token]` for instant mobile payments.

---

## 5. Stripe Connect v2 Architecture & 5-State Machine

Invoice Pro Agios adheres to Stripe's latest **Accounts v2** (`/v2/core/accounts`) standard:
- **Direct Charge Model:** Transactions execute directly on the operator's connected merchant account (`stripe_v2_account_id`).
- **Isolation:** Subscriber SaaS billing (e.g., $20/mo Founder Beta or $50/mo Pro) is strictly separated from business customer transaction volume.
- **Deterministic 5-State Payment Lifecycle:**

```
  ┌───────────┐
  │  pending  ├──────────┬────────────────────────┐
  └─────┬─────┘          │                        │
        │                ▼                        ▼
        │        ┌──────────────┐         ┌──────────────┐
        ├───────►│  processing  ├────────►│  succeeded   │
        │        └───────┬──────┘         └───────┬──────┘
        ▼                │                        │
  ┌───────────┐          │                        ▼
  │  failed   │◄─────────┘                ┌──────────────┐
  └─────┬─────┘                           │   refunded   │
        │ (retry)                         └──────────────┘
        └────────► pending
```

Legal transitions are deterministically verified in `lib/stripe/connect-v2-architecture.ts` and tested via automated unit tests.

---

## 6. Gemini 3.8 Flash AI Intelligence

The platform integrates Google's **Gemini 3.8 Flash** model via server-side endpoints:
- **Voice-to-Invoice (`/api/ai/voice-to-invoice`):** Transcribes audio memos, conversational field notes, and bilingual service summaries into structured line items, customer details, and payment terms using strict Zod schemas (`lib/validators/ai-extraction.ts`).
- **Intelligent Document Processing (`/api/ai/idp-extract`):** Parses raw text from supply receipts, wholesale parts tickets, and subcontractor invoices into structured digital line items.
- **Human Confirmation Boundary:** AI extractions are staged for review and require explicit human confirmation before committing to the database.

---

## 7. Database Schema & Multi-Tenant Data Layer

The database layer utilizes SQLite via Node.js native `node:sqlite` (`DatabaseSync`) located in `.data/invoice_pro.db`. Migrations and seed routines (`lib/db/session2.ts`) run idempotently at boot.

### Core Tables

- `organizations`: Multi-tenant business entities (`id`, `name`, `slug`, `brand_primary_color`, `logo_url`, `logo_format`, `default_footer_message`, `stripe_v2_account_id`).
- `customers`: Client records (`id`, `organization_id`, `name`, `company_name`, `email`, `phone`, `service_address`, `total_billed_cents`, `total_paid_cents`).
- `invoices`: Unified ledger for invoices and estimates (`id`, `organization_id`, `customer_id`, `document_type`, `document_status`, `payment_status`, `public_token`, `subtotal_cents`, `discount_cents`, `tax_amount_cents`, `total_amount_cents`, `deposit_enabled`, `deposit_amount_cents`, `deposit_paid_cents`, `balance_due_cents`, `late_fee_applied_cents`).
- `invoice_line_items`: Itemized goods and services (`id`, `invoice_id`, `category`, `description`, `quantity`, `unit_price_cents`, `line_total_cents`, `note`).
- `document_attachments`: Two-way files and photos (`id`, `document_id`, `uploaded_by_role`, `uploader_name`, `file_name`, `mime_type`, `file_size_bytes`, `data_url_or_path`).
- `payment_reminders`: Scheduled automated notices (`id`, `document_id`, `trigger_type`, `scheduled_for`, `sent_at`, `status`).
- `invoice_events`: Cryptographic audit log (`id`, `invoice_id`, `organization_id`, `event_type`, `actor`, `summary`, `metadata`).

---

## 8. Environment Variables

Configure your `.env.local` based on `.env.example`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | Application brand name | `"Invoice Pro Agios"` |
| `NEXT_PUBLIC_APP_ENV` | Runtime environment | `"prototype_preview"` |
| `NEXT_PUBLIC_APP_URL` | Local or production web URL | `"http://localhost:3000"` |
| `AI_PROVIDER` | AI provider key identifier | `"google_gemini"` |
| `GEMINI_API_KEY` | Google Gemini API key (Server-only) | `"your-gemini-key"` |
| `GEMINI_MODEL` | Gemini extraction model | `"gemini-3.8-flash"` |
| `PAYMENT_EXECUTION_MODE` | Payment processing execution mode | `"simulated"` or `"stripe_test"` |
| `STRIPE_CONNECT_API_VERSION` | Stripe Connect API version | `"2026-02-25.acacia"` |
| `NEXT_PUBLIC_STRIPE_FOUNDER_BETA_URL` | Optional live Stripe Payment Link for $20/mo Beta | `"https://buy.stripe.com/..."` |

---

## 9. Automated Test Suite (10/10 Passing)

Run the test suite using Node's native test runner:

```bash
npm test
```

### Verified Test Assertions:
1. **Deterministic Cent Math (Line Items):** Integer cent multiplication and rounding across fractional quantities.
2. **Deterministic Cent Math (Estimate #3060):** Exact validation of $3,863.96 equipment, convenience fee, and labor breakdown.
3. **Flat & Percentage Deposit Splits:** Correct calculation of upfront deposit milestones.
4. **Payment Waterfall:** Verifies that payments satisfy deposit requirements before reducing remaining balances.
5. **Late Fee Calculation:** Enforces percentage and flat fee rules with grace period checks.
6. **Estimate-to-Invoice Conversion:** Validates preservation of line items, attachments, deposits, and reminder re-anchoring.
7. **Stripe Connect v2 5-State Machine:** Asserts valid state transitions and rejects illegal transitions (e.g., refunded $\rightarrow$ pending).
8. **Session 2.5 Data Seeding Integrity:** Validates seeded Invoice #5033 ($160.00 paid in full), Estimate #3060, and 5 Star Plumbing Service.
9. **Business Branding Persistence:** Asserts updates to logo, format, brand color, and footer messages.
10. **Inline Customer Creation:** Validates customer creation and organizational relationship mapping without draft loss.

---

## 10. Development & Production Build

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the Prime Executive Landing Page or [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the Operator Workspace.

### Production Build
```bash
npm run build
```

---

## 11. Studio Licensing & Governance

Developed by **AGIOS Venture Studio** ([agiosventure.com](https://www.agiosventure.com)).  
All rights reserved &copy; 2026 AGIOS Venture Studio.
