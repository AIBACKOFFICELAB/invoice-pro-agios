import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { computeInvoiceTotals, formatCents } from "../finance/calculator.ts";
import { migrateSession2, seedSession2 } from "./session2.ts";
import type { InvoicePaymentStatus } from "../stripe/connect-v2-architecture.ts";
import {
  canTransitionPaymentState,
  PAYMENT_STATUS_CONFIG,
} from "../stripe/connect-v2-architecture.ts";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "invoice_pro.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Single persistent connection
let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec("PRAGMA foreign_keys = ON;");
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      business_email TEXT,
      business_phone TEXT,
      business_address TEXT,
      logo_url TEXT,
      brand_primary_color TEXT DEFAULT '#2563EB',
      default_tax_rate REAL DEFAULT 0.00,
      default_payment_terms_days INTEGER DEFAULT 14,
      saas_stripe_customer_id TEXT,
      saas_subscription_status TEXT DEFAULT 'prototype_eval',
      stripe_v2_account_id TEXT,
      stripe_v2_merchant_capability_status TEXT DEFAULT 'not_connected',
      stripe_charge_mode TEXT DEFAULT 'direct_charge',
      reminder_engine_enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      service_address TEXT,
      notes TEXT,
      total_billed_cents INTEGER NOT NULL DEFAULT 0,
      total_paid_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      invoice_number TEXT NOT NULL,
      public_token TEXT NOT NULL UNIQUE,
      document_status TEXT NOT NULL DEFAULT 'draft',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      subtotal_cents INTEGER NOT NULL DEFAULT 0,
      discount_cents INTEGER NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0.00,
      tax_amount_cents INTEGER NOT NULL DEFAULT 0,
      total_amount_cents INTEGER NOT NULL DEFAULT 0,
      amount_paid_cents INTEGER NOT NULL DEFAULT 0,
      amount_refunded_cents INTEGER NOT NULL DEFAULT 0,
      balance_due_cents INTEGER NOT NULL DEFAULT 0,
      payment_method_type TEXT DEFAULT 'stripe_direct_charge',
      stripe_connected_account_id TEXT,
      stripe_payment_intent_id TEXT,
      last_payment_error TEXT,
      creation_source TEXT NOT NULL DEFAULT 'manual',
      ai_model_used TEXT,
      ai_human_confirmed INTEGER NOT NULL DEFAULT 0,
      ai_confirmed_at TEXT,
      notes TEXT,
      paid_at TEXT,
      refunded_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(organization_id, invoice_number)
    );

    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      category TEXT DEFAULT 'service',
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      line_total_cents INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoice_events (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'contractor',
      summary TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Check if organizations exist
  const countRow = db.prepare("SELECT COUNT(*) as count FROM organizations").get() as { count: number };
  if (countRow.count === 0) {
    seedSyntheticData(db);
  }

  // Session 2: estimates, attachments, deposits, reminders, late fees
  migrateSession2(db);
  seedSession2(db);
}

function seedSyntheticData(db: DatabaseSync) {
  console.log("Seeding synthetic contractor demonstration data for Session 1...");

  // 1. Organizations
  const orgs = [
    {
      id: "org_apex_01",
      name: "Apex Electrical Solutions",
      slug: "apex-electric",
      owner_id: "usr_sarah_jenkins",
      business_email: "billing@apexelectric.preview",
      business_phone: "(512) 883-4920",
      business_address: "4800 Industrial Way, Suite 210, Austin, TX 78744",
      brand_primary_color: "#2563EB",
      default_tax_rate: 8.25,
      default_payment_terms_days: 14,
      stripe_v2_account_id: "acct_1NqZApexV2Direct",
      stripe_v2_merchant_capability_status: "active_test",
    },
    {
      id: "org_summit_02",
      name: "Summit HVAC & Refrigeration",
      slug: "summit-hvac",
      owner_id: "usr_marcus_rivera",
      business_email: "accounts@summithvac.preview",
      business_phone: "(303) 555-0199",
      business_address: "1240 Peak Blvd, Denver, CO 80204",
      brand_primary_color: "#0284C7",
      default_tax_rate: 7.75,
      default_payment_terms_days: 30,
      stripe_v2_account_id: "acct_1NqZSummitV2Direct",
      stripe_v2_merchant_capability_status: "active_test",
    },
    {
      id: "org_vanguard_03",
      name: "Vanguard Plumbing & Mechanical",
      slug: "vanguard-plumbing",
      owner_id: "usr_david_chen",
      business_email: "service@vanguardplumb.preview",
      business_phone: "(206) 555-0144",
      business_address: "910 Harbor View St, Seattle, WA 98101",
      brand_primary_color: "#0D9488",
      default_tax_rate: 10.25,
      default_payment_terms_days: 7,
      stripe_v2_account_id: "acct_1NqZVanguardV2Direct",
      stripe_v2_merchant_capability_status: "active_test",
    },
  ];

  const insertOrg = db.prepare(`
    INSERT INTO organizations (
      id, name, slug, owner_id, business_email, business_phone, business_address,
      brand_primary_color, default_tax_rate, default_payment_terms_days,
      stripe_v2_account_id, stripe_v2_merchant_capability_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const org of orgs) {
    insertOrg.run(
      org.id, org.name, org.slug, org.owner_id, org.business_email,
      org.business_phone, org.business_address, org.brand_primary_color,
      org.default_tax_rate, org.default_payment_terms_days,
      org.stripe_v2_account_id, org.stripe_v2_merchant_capability_status
    );
  }

  // 2. Customers
  const customers = [
    {
      id: "cust_apex_c1",
      org_id: "org_apex_01",
      name: "Evelyn Wright",
      company_name: "Wright Commercial Real Estate",
      email: "ewright@wrightproperties.example",
      phone: "(512) 555-8392",
      service_address: "701 Brazos St, Austin, TX 78701",
      notes: "Preferred technician: Sarah. Access keycard with security guard.",
      total_billed: 548000,
      total_paid: 548000,
    },
    {
      id: "cust_apex_c2",
      org_id: "org_apex_01",
      name: "Travis Miller",
      company_name: "Miller Craft Brewing Co.",
      email: "travis@millercraft.example",
      phone: "(512) 555-1204",
      service_address: "1020 E 6th St, Austin, TX 78702",
      notes: "Main service panel upgrade for canning line compressor.",
      total_billed: 385000,
      total_paid: 0,
    },
    {
      id: "cust_apex_c3",
      org_id: "org_apex_01",
      name: "Elena Ross",
      company_name: "Ross Boutique Hotel",
      email: "elena@rosshotel.example",
      phone: "(512) 555-9011",
      service_address: "1405 S Congress Ave, Austin, TX 78704",
      notes: "Emergency exterior transformer maintenance.",
      total_billed: 195000,
      total_paid: 195000,
    },
    {
      id: "cust_summit_c1",
      org_id: "org_summit_02",
      name: "Grant Lawson",
      company_name: "Highland Medical Office Park",
      email: "glawson@highlandmed.example",
      phone: "(303) 555-4300",
      service_address: "3400 E 17th Ave, Denver, CO 80206",
      notes: "Quarterly rooftop chilled water loop inspection.",
      total_billed: 720000,
      total_paid: 720000,
    },
    {
      id: "cust_vanguard_c1",
      org_id: "org_vanguard_03",
      name: "Chloe Bennett",
      company_name: "Bennett Roasting Labs",
      email: "chloe@bennettroasters.example",
      phone: "(206) 555-7711",
      service_address: "440 Terry Ave N, Seattle, WA 98109",
      notes: "Commercial grease trap & gas line backflow assembly.",
      total_billed: 412000,
      total_paid: 412000,
    },
  ];

  const insertCust = db.prepare(`
    INSERT INTO customers (
      id, organization_id, name, company_name, email, phone,
      service_address, notes, total_billed_cents, total_paid_cents
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of customers) {
    insertCust.run(
      c.id, c.org_id, c.name, c.company_name, c.email, c.phone,
      c.service_address, c.notes, c.total_billed, c.total_paid
    );
  }

  // 3. Invoices across 5 distinct payment states
  const invoiceData = [
    {
      id: "inv_apex_succeeded",
      org_id: "org_apex_01",
      cust_id: "cust_apex_c1",
      inv_num: "INV-2026-001",
      token: "tok_apex_succ_9a8b",
      doc_status: "sent",
      pay_status: "succeeded",
      issue_date: "2026-09-15",
      due_date: "2026-09-29",
      tax_rate: 8.25,
      items: [
        { desc: "200A 3-Phase Main Distribution Panel Upgrade", cat: "labor", qty: 1, price: 320000 },
        { desc: "Square D 200A Main Breaker & Enclosure Kit", cat: "material", qty: 1, price: 115000 },
        { desc: "Austin Energy City Permit & Inspection Fee", cat: "service", qty: 1, price: 35000 },
      ],
      amount_paid: 508775,
      stripe_intent: "pi_test_v2_direct_succeeded_01",
      source: "manual",
      notes: "Full payment captured via Stripe Direct Charge to Apex merchant account.",
    },
    {
      id: "inv_apex_pending",
      org_id: "org_apex_01",
      cust_id: "cust_apex_c2",
      inv_num: "INV-2026-002",
      token: "tok_apex_pend_3c4d",
      doc_status: "sent",
      pay_status: "pending",
      issue_date: "2026-10-02",
      due_date: "2026-10-16",
      tax_rate: 8.25,
      items: [
        { desc: "Brewery Canning Line Dedicated 50A Circuit Run", cat: "service", qty: 1, price: 185000 },
        { desc: "Heavy Duty EMT Conduit & THHN Copper Wire (#6 AWG)", cat: "material", qty: 120, price: 425 },
        { desc: "Emergency Disconnect Switch (60A NEMA 4X Washdown)", cat: "equipment", qty: 1, price: 48000 },
      ],
      amount_paid: 0,
      stripe_intent: "pi_test_v2_direct_pending_02",
      source: "voice_to_invoice",
      ai_confirmed: 1,
      notes: "Invoice sent to Travis Miller. Awaiting online payment.",
    },
    {
      id: "inv_apex_processing",
      org_id: "org_apex_01",
      cust_id: "cust_apex_c3",
      inv_num: "INV-2026-003",
      token: "tok_apex_proc_5e6f",
      doc_status: "sent",
      pay_status: "processing",
      issue_date: "2026-10-08",
      due_date: "2026-10-22",
      tax_rate: 8.25,
      items: [
        { desc: "Boutique Hotel Exterior Facade LED Lighting Overhaul", cat: "service", qty: 1, price: 140000 },
        { desc: "Programmable Astronomical Timer & DMX Controller", cat: "equipment", qty: 1, price: 42000 },
      ],
      amount_paid: 0,
      stripe_intent: "pi_test_v2_direct_processing_03",
      source: "idp_document",
      ai_confirmed: 1,
      notes: "Customer authorized payment via ACH Bank Debit; settlement in progress (1-2 business days).",
    },
    {
      id: "inv_apex_failed",
      org_id: "org_apex_01",
      cust_id: "cust_apex_c2",
      inv_num: "INV-2026-004",
      token: "tok_apex_fail_7g8h",
      doc_status: "sent",
      pay_status: "failed",
      issue_date: "2026-10-05",
      due_date: "2026-10-12",
      tax_rate: 8.25,
      items: [
        { desc: "Fermentation Tank Glycol Chiller Electrical Hookup", cat: "labor", qty: 6, price: 12500 },
        { desc: "Industrial Liquid-Tight Flexible Conduit (3/4\")", cat: "material", qty: 30, price: 350 },
      ],
      amount_paid: 0,
      stripe_intent: "pi_test_v2_direct_failed_04",
      last_error: "Card declined: insufficient_funds (test decline simulation)",
      source: "manual",
      notes: "Customer credit card was declined. Automatic retry notification logged.",
    },
    {
      id: "inv_apex_refunded",
      org_id: "org_apex_01",
      cust_id: "cust_apex_c1",
      inv_num: "INV-2026-005",
      token: "tok_apex_refu_1j2k",
      doc_status: "sent",
      pay_status: "refunded",
      issue_date: "2026-09-20",
      due_date: "2026-10-04",
      tax_rate: 8.25,
      items: [
        { desc: "Canceled Service: Second Floor Sub-Panel Feeder Diagnostic", cat: "service", qty: 1, price: 45000 },
      ],
      amount_paid: 48713,
      amount_refunded: 48713,
      stripe_intent: "pi_test_v2_direct_refunded_05",
      source: "manual",
      notes: "Work order canceled due to tenant lease change; full refund processed to card.",
    },
  ];

  const insertInv = db.prepare(`
    INSERT INTO invoices (
      id, organization_id, customer_id, invoice_number, public_token,
      document_status, payment_status, issue_date, due_date, currency,
      subtotal_cents, discount_cents, tax_rate, tax_amount_cents,
      total_amount_cents, amount_paid_cents, amount_refunded_cents, balance_due_cents,
      stripe_connected_account_id, stripe_payment_intent_id, last_payment_error,
      creation_source, ai_human_confirmed, notes, paid_at, refunded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO invoice_line_items (
      id, invoice_id, organization_id, sort_order, category, description,
      quantity, unit_price_cents, line_total_cents
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO invoice_events (
      id, invoice_id, organization_id, event_type, actor, summary, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const inv of invoiceData) {
    const totals = computeInvoiceTotals({
      lineItems: inv.items.map(it => ({ quantity: it.qty, unitPriceCents: it.price })),
      taxRatePercent: inv.tax_rate,
      amountPaidCents: inv.amount_paid || 0,
    });

    const paidAt = inv.pay_status === "succeeded" || inv.pay_status === "refunded" ? "2026-09-16 14:22:00" : null;
    const refundedAt = inv.pay_status === "refunded" ? "2026-09-22 09:15:00" : null;

    insertInv.run(
      inv.id, inv.org_id, inv.cust_id, inv.inv_num, inv.token,
      inv.doc_status, inv.pay_status, inv.issue_date, inv.due_date, "USD",
      totals.subtotalCents, totals.discountCents, inv.tax_rate, totals.taxAmountCents,
      totals.totalAmountCents, totals.amountPaidCents, inv.amount_refunded || 0,
      totals.balanceDueCents, "acct_1NqZApexV2Direct", inv.stripe_intent, inv.last_error || null,
      inv.source, inv.ai_confirmed || 0, inv.notes, paidAt, refundedAt
    );

    // Line items
    inv.items.forEach((item, idx) => {
      const lineTotal = Math.round(item.qty * item.price);
      insertItem.run(
        `item_${inv.id}_${idx + 1}`,
        inv.id,
        inv.org_id,
        idx,
        item.cat,
        item.desc,
        item.qty,
        item.price,
        lineTotal
      );
    });

    // Timeline audit events
    insertEvent.run(
      `evt_${inv.id}_create`,
      inv.id,
      inv.org_id,
      "invoice_created",
      "contractor",
      `Invoice ${inv.inv_num} drafted (${totals.totalAmountCents ? formatCents(totals.totalAmountCents) : "$0.00"})`,
      JSON.stringify({ source: inv.source }),
      `${inv.issue_date} 08:30:00`
    );

    if (inv.source !== "manual") {
      insertEvent.run(
        `evt_${inv.id}_ai_confirm`,
        inv.id,
        inv.org_id,
        "ai_extraction_confirmed",
        "contractor",
        `AI extraction verified and confirmed by Sarah Jenkins (Model: gemini-3.8-flash)`,
        JSON.stringify({ zero_hallucination_review: true }),
        `${inv.issue_date} 08:35:00`
      );
    }

    insertEvent.run(
      `evt_${inv.id}_sent`,
      inv.id,
      inv.org_id,
      "invoice_sent_sandbox",
      "system",
      `Invoice token link dispatched to customer (Sandbox: /i/${inv.token})`,
      JSON.stringify({ token: inv.token }),
      `${inv.issue_date} 09:00:00`
    );

    insertEvent.run(
      `evt_${inv.id}_viewed`,
      inv.id,
      inv.org_id,
      "public_page_viewed",
      "customer",
      `Customer opened public invoice page via link /i/${inv.token}`,
      JSON.stringify({ ip_sim: "172.56.21.90" }),
      `${inv.issue_date} 10:14:00`
    );

    if (inv.pay_status === "succeeded") {
      insertEvent.run(
        `evt_${inv.id}_paid`,
        inv.id,
        inv.org_id,
        "payment_succeeded",
        "stripe_webhook",
        `Stripe Direct Charge succeeded (${formatCents(totals.totalAmountCents)} settled to acct_1NqZApexV2Direct)`,
        JSON.stringify({ payment_intent: inv.stripe_intent }),
        "2026-09-16 14:22:00"
      );
    } else if (inv.pay_status === "processing") {
      insertEvent.run(
        `evt_${inv.id}_processing`,
        inv.id,
        inv.org_id,
        "payment_processing",
        "stripe_webhook",
        `ACH payment processing. Webhook event: payment_intent.processing`,
        JSON.stringify({ payment_intent: inv.stripe_intent }),
        "2026-10-08 11:20:00"
      );
    } else if (inv.pay_status === "failed") {
      insertEvent.run(
        `evt_${inv.id}_failed`,
        inv.id,
        inv.org_id,
        "payment_failed",
        "stripe_webhook",
        `Payment attempt failed: ${inv.last_error}`,
        JSON.stringify({ payment_intent: inv.stripe_intent }),
        "2026-10-05 16:45:00"
      );
    } else if (inv.pay_status === "refunded") {
      insertEvent.run(
        `evt_${inv.id}_paid_before_ref`,
        inv.id,
        inv.org_id,
        "payment_succeeded",
        "stripe_webhook",
        `Initial charge succeeded (${formatCents(totals.totalAmountCents)})`,
        JSON.stringify({ payment_intent: inv.stripe_intent }),
        "2026-09-20 10:00:00"
      );
      insertEvent.run(
        `evt_${inv.id}_refunded`,
        inv.id,
        inv.org_id,
        "payment_refunded",
        "contractor",
        `Full refund of ${formatCents(totals.totalAmountCents)} issued via Stripe Direct Charge`,
        JSON.stringify({ refund_reason: "work_order_canceled" }),
        "2026-09-22 09:15:00"
      );
    }
  }

  console.log("Synthetic data seeded successfully!");
}

// -----------------------------------------------------------------------------
// REPOSITORY METHODS
// -----------------------------------------------------------------------------

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  logo_url: string | null;
  brand_primary_color: string;
  default_tax_rate: number;
  default_payment_terms_days: number;
  saas_stripe_customer_id: string | null;
  saas_subscription_status: string;
  stripe_v2_account_id: string | null;
  stripe_v2_merchant_capability_status: string;
  stripe_charge_mode: string;
  reminder_engine_enabled: number;
  logo_format?: "framed" | "full";
  default_footer_message?: string;
}

export interface CustomerRecord {
  id: string;
  organization_id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  service_address: string | null;
  notes: string | null;
  total_billed_cents: number;
  total_paid_cents: number;
  created_at: string;
}

export interface InvoiceRecord {
  id: string;
  organization_id: string;
  customer_id: string;
  customer_name?: string;
  customer_company?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  service_address?: string | null;
  org_name?: string;
  org_email?: string;
  org_phone?: string;
  org_address?: string;
  org_brand_color?: string;
  org_tax_rate?: number;
  invoice_number: string;
  public_token: string;
  document_status: string;
  payment_status: InvoicePaymentStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  tax_rate: number;
  tax_amount_cents: number;
  total_amount_cents: number;
  amount_paid_cents: number;
  amount_refunded_cents: number;
  balance_due_cents: number;
  payment_method_type: string | null;
  stripe_connected_account_id: string | null;
  stripe_payment_intent_id: string | null;
  last_payment_error: string | null;
  creation_source: string;
  ai_model_used: string | null;
  ai_human_confirmed: number;
  ai_confirmed_at: string | null;
  notes: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  line_items?: InvoiceLineItemRecord[];
  events?: InvoiceEventRecord[];
  attachments?: Record<string, any>[];
  reminders?: Record<string, any>[];
  [key: string]: any;
}

export interface InvoiceLineItemRecord {
  note?: string | null;
  id: string;
  invoice_id: string;
  organization_id: string;
  sort_order: number;
  category: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

export interface InvoiceEventRecord {
  id: string;
  invoice_id: string;
  organization_id: string;
  event_type: string;
  actor: string;
  summary: string;
  metadata: string;
  created_at: string;
}

export function getAllOrganizations(): OrganizationRecord[] {
  const db = getDb();
  return db.prepare("SELECT * FROM organizations ORDER BY name ASC").all() as unknown as OrganizationRecord[];
}

export function getOrganizationById(id: string): OrganizationRecord | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM organizations WHERE id = ?").get(id) as unknown as OrganizationRecord) || null;
}

export function getOrganizationBySlug(slug: string): OrganizationRecord | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM organizations WHERE slug = ?").get(slug) as unknown as OrganizationRecord) || null;
}

export function updateOrganizationBranding(id: string, updates: Partial<OrganizationRecord>): boolean {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
  if (updates.business_email !== undefined) { fields.push("business_email = ?"); values.push(updates.business_email); }
  if (updates.business_phone !== undefined) { fields.push("business_phone = ?"); values.push(updates.business_phone); }
  if (updates.business_address !== undefined) { fields.push("business_address = ?"); values.push(updates.business_address); }
  if (updates.logo_url !== undefined) { fields.push("logo_url = ?"); values.push(updates.logo_url); }
  if (updates.logo_format !== undefined) { fields.push("logo_format = ?"); values.push(updates.logo_format); }
  if (updates.default_footer_message !== undefined) { fields.push("default_footer_message = ?"); values.push(updates.default_footer_message); }
  if (updates.brand_primary_color !== undefined) { fields.push("brand_primary_color = ?"); values.push(updates.brand_primary_color); }
  if (updates.default_tax_rate !== undefined) { fields.push("default_tax_rate = ?"); values.push(updates.default_tax_rate); }
  if (updates.default_payment_terms_days !== undefined) { fields.push("default_payment_terms_days = ?"); values.push(updates.default_payment_terms_days); }

  if (fields.length === 0) return true;
  values.push(id);
  const sql = `UPDATE organizations SET ${fields.join(", ")}, updated_at = datetime('now') WHERE id = ?`;
  db.prepare(sql).run(...values);
  return true;
}

export function getCustomersByOrg(orgId: string): CustomerRecord[] {
  const db = getDb();
  return db.prepare("SELECT * FROM customers WHERE organization_id = ? ORDER BY name ASC").all(orgId) as unknown as CustomerRecord[];
}

export function getCustomerById(id: string): CustomerRecord | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as unknown as CustomerRecord) || null;
}

export function createCustomer(data: {
  organization_id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  service_address?: string;
  notes?: string;
}): CustomerRecord {
  const db = getDb();
  const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  db.prepare(`
    INSERT INTO customers (
      id, organization_id, name, company_name, email, phone, service_address, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.organization_id,
    data.name,
    data.company_name || null,
    data.email || null,
    data.phone || null,
    data.service_address || null,
    data.notes || null
  );
  return getCustomerById(id)!;
}

export function getInvoicesByOrg(orgId: string, paymentFilter?: string, type: "invoice" | "estimate" = "invoice"): InvoiceRecord[] {
  const db = getDb();
  if (type === "estimate") {
    db.prepare(
      `UPDATE invoices SET document_status = 'expired'
       WHERE organization_id = ? AND document_type = 'estimate'
         AND document_status IN ('sent','viewed') AND expires_at IS NOT NULL AND expires_at < date('now')`
    ).run(orgId);
  }
  let sql = `
    SELECT i.*, c.name as customer_name, c.company_name as customer_company
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.organization_id = ? AND i.document_type = ?
  `;
  const params: any[] = [orgId, type];

  if (paymentFilter && paymentFilter !== "all") {
    sql += type === "estimate" ? " AND i.document_status = ?" : " AND i.payment_status = ?";
    params.push(paymentFilter);
  }

  sql += " ORDER BY i.created_at DESC";
  return db.prepare(sql).all(...params) as unknown as InvoiceRecord[];
}

export function getInvoiceById(id: string): InvoiceRecord | null {
  const db = getDb();
  const inv = db.prepare(`
    SELECT i.*,
           c.name as customer_name, c.company_name as customer_company,
           c.email as customer_email, c.phone as customer_phone, c.service_address,
           o.name as org_name, o.business_email as org_email, o.business_phone as org_phone,
           o.business_address as org_address, o.brand_primary_color as org_brand_color,
           o.default_tax_rate as org_tax_rate, o.logo_url as org_logo_url,
           o.logo_format as org_logo_format, o.default_footer_message as org_default_footer_message
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN organizations o ON i.organization_id = o.id
    WHERE i.id = ?
  `).get(id) as unknown as InvoiceRecord | undefined;

  if (!inv) return null;

  inv.line_items = db.prepare(
    "SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sort_order ASC"
  ).all(id) as unknown as InvoiceLineItemRecord[];

  inv.events = db.prepare(
    "SELECT * FROM invoice_events WHERE invoice_id = ? ORDER BY created_at DESC"
  ).all(id) as unknown as InvoiceEventRecord[];

  inv.attachments = db.prepare(
    "SELECT * FROM document_attachments WHERE document_id = ? ORDER BY created_at ASC"
  ).all(id) as unknown as Record<string, any>[];

  inv.reminders = db.prepare(
    "SELECT * FROM payment_reminders WHERE document_id = ? ORDER BY scheduled_for ASC"
  ).all(id) as unknown as Record<string, any>[];

  return inv;
}

export function getInvoiceByToken(token: string): InvoiceRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT id FROM invoices WHERE public_token = ?").get(token) as { id: string } | undefined;
  if (!row) return null;
  return getInvoiceById(row.id);
}

export function createInvoice(data: {
  organization_id: string;
  customer_id: string;
  invoice_number?: string;
  issue_date: string;
  due_date: string;
  tax_rate: number;
  discount_cents?: number;
  notes?: string;
  creation_source?: string;
  ai_model_used?: string;
  ai_human_confirmed?: boolean;
  line_items: Array<{
    category: string;
    description: string;
    quantity: number;
    unit_price_cents: number;
  }>;
}): InvoiceRecord {
  const db = getDb();
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const publicToken = `tok_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

  // Deterministic invoice number if not provided
  let invNum = data.invoice_number;
  if (!invNum) {
    const count = (db.prepare("SELECT COUNT(*) as c FROM invoices WHERE organization_id = ?").get(data.organization_id) as { c: number }).c;
    invNum = `INV-2026-${String(count + 101).padStart(4, "0")}`;
  }

  const totals = computeInvoiceTotals({
    lineItems: data.line_items.map(it => ({ quantity: it.quantity, unitPriceCents: it.unit_price_cents })),
    discountCents: data.discount_cents || 0,
    taxRatePercent: data.tax_rate,
    amountPaidCents: 0,
  });

  const org = getOrganizationById(data.organization_id);

  db.prepare(`
    INSERT INTO invoices (
      id, organization_id, customer_id, invoice_number, public_token,
      document_status, payment_status, issue_date, due_date, currency,
      subtotal_cents, discount_cents, tax_rate, tax_amount_cents,
      total_amount_cents, amount_paid_cents, amount_refunded_cents, balance_due_cents,
      stripe_connected_account_id, creation_source, ai_model_used,
      ai_human_confirmed, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invoiceId,
    data.organization_id,
    data.customer_id,
    invNum,
    publicToken,
    "draft",
    "pending",
    data.issue_date,
    data.due_date,
    "USD",
    totals.subtotalCents,
    totals.discountCents,
    data.tax_rate,
    totals.taxAmountCents,
    totals.totalAmountCents,
    0,
    0,
    totals.balanceDueCents,
    org?.stripe_v2_account_id || "acct_test_v2_simulated",
    data.creation_source || "manual",
    data.ai_model_used || null,
    data.ai_human_confirmed ? 1 : 0,
    data.notes || null
  );

  // Line items
  data.line_items.forEach((item, idx) => {
    const lineTotal = Math.round(item.quantity * item.unit_price_cents);
    db.prepare(`
      INSERT INTO invoice_line_items (
        id, invoice_id, organization_id, sort_order, category, description,
        quantity, unit_price_cents, line_total_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `item_${invoiceId}_${idx + 1}`,
      invoiceId,
      data.organization_id,
      idx,
      item.category,
      item.description,
      item.quantity,
      item.unit_price_cents,
      lineTotal
    );
  });

  // Log creation event
  logInvoiceEvent(
    invoiceId,
    data.organization_id,
    "invoice_created",
    "contractor",
    `Invoice ${invNum} created with ${data.line_items.length} line item(s) (${formatCents(totals.totalAmountCents)})`
  );

  if (data.ai_human_confirmed) {
    logInvoiceEvent(
      invoiceId,
      data.organization_id,
      "ai_extraction_confirmed",
      "contractor",
      `AI extraction confirmed and verified by contractor (Model: ${data.ai_model_used || "gemini-3.8-flash"})`
    );
  }

  return getInvoiceById(invoiceId)!;
}

export function logInvoiceEvent(
  invoiceId: string,
  orgId: string,
  eventType: string,
  actor: string,
  summary: string,
  metadata?: any
): void {
  const db = getDb();
  const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO invoice_events (
      id, invoice_id, organization_id, event_type, actor, summary, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    invoiceId,
    orgId,
    eventType,
    actor,
    summary,
    metadata ? JSON.stringify(metadata) : "{}"
  );
}

export function transitionInvoicePaymentStatus(
  invoiceId: string,
  nextStatus: InvoicePaymentStatus,
  note?: string
): { success: boolean; error?: string; invoice?: InvoiceRecord } {
  const inv = getInvoiceById(invoiceId);
  if (!inv) {
    return { success: false, error: "Invoice not found" };
  }

  const currentStatus = inv.payment_status;
  if (!canTransitionPaymentState(currentStatus, nextStatus)) {
    return {
      success: false,
      error: `Invalid transition from '${currentStatus}' to '${nextStatus}'. Allowed: [${canTransitionPaymentState(currentStatus, nextStatus)}]`,
    };
  }

  const db = getDb();
  let amountPaid = inv.amount_paid_cents;
  let amountRefunded = inv.amount_refunded_cents;
  let paidAt = inv.paid_at;
  let refundedAt = inv.refunded_at;
  let lastError = inv.last_payment_error;

  if (nextStatus === "succeeded") {
    amountPaid = inv.total_amount_cents;
    paidAt = new Date().toISOString();
    lastError = null;
  } else if (nextStatus === "refunded") {
    amountRefunded = inv.amount_paid_cents;
    refundedAt = new Date().toISOString();
  } else if (nextStatus === "failed") {
    lastError = note || "Simulation: Payment declined by issuing bank.";
  } else if (nextStatus === "pending") {
    lastError = null;
  }

  const balanceDue = Math.max(0, inv.total_amount_cents - amountPaid);

  db.prepare(`
    UPDATE invoices
    SET payment_status = ?,
        amount_paid_cents = ?,
        amount_refunded_cents = ?,
        balance_due_cents = ?,
        paid_at = ?,
        refunded_at = ?,
        last_payment_error = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    nextStatus,
    amountPaid,
    amountRefunded,
    balanceDue,
    paidAt,
    refundedAt,
    lastError,
    invoiceId
  );

  // Session 2: keep deposit_paid_cents consistent with amount paid
  db.prepare("UPDATE invoices SET deposit_paid_cents = MIN(amount_paid_cents, deposit_amount_cents) WHERE id = ?").run(invoiceId);

  const eventTypeMap: Record<InvoicePaymentStatus, string> = {
    pending: "payment_pending",
    processing: "payment_processing",
    succeeded: "payment_succeeded",
    failed: "payment_failed",
    refunded: "payment_refunded",
  };

  const statusConfig = PAYMENT_STATUS_CONFIG[nextStatus];
  logInvoiceEvent(
    invoiceId,
    inv.organization_id,
    eventTypeMap[nextStatus],
    "stripe_webhook",
    note || `Payment state transitioned to ${statusConfig.label} via Direct Charge`,
    { previous_state: currentStatus, new_state: nextStatus }
  );

  return { success: true, invoice: getInvoiceById(invoiceId)! };
}

export function updateInvoiceDocumentStatus(invoiceId: string, status: string): boolean {
  const db = getDb();
  const inv = getInvoiceById(invoiceId);
  if (!inv) return false;

  db.prepare("UPDATE invoices SET document_status = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    invoiceId
  );

  logInvoiceEvent(
    invoiceId,
    inv.organization_id,
    status === "sent" ? "invoice_sent_sandbox" : "invoice_edited",
    "contractor",
    `Document lifecycle state changed to ${status}`
  );

  return true;
}

export function getDashboardKPIs(orgId: string) {
  const db = getDb();
  const invoices = getInvoicesByOrg(orgId);

  let collectedRevenueCents = 0;
  let pendingProcessingVolumeCents = 0;
  let overdueBalanceCents = 0;
  let succeededCount = 0;

  const today = new Date().toISOString().split("T")[0];

  for (const inv of invoices) {
    if (inv.payment_status === "succeeded") {
      collectedRevenueCents += inv.total_amount_cents;
      succeededCount++;
    } else if (inv.payment_status === "pending" || inv.payment_status === "processing") {
      pendingProcessingVolumeCents += inv.balance_due_cents;
      if (inv.due_date < today) {
        overdueBalanceCents += inv.balance_due_cents;
      }
    } else if (inv.payment_status === "failed") {
      overdueBalanceCents += inv.balance_due_cents;
    }
  }

  // Average settlement time (mocked based on realistic 2.4 days)
  const averageSettlementDays = succeededCount > 0 ? "1.8 days" : "—";

  return {
    totalInvoices: invoices.length,
    collectedRevenueCents,
    pendingProcessingVolumeCents,
    overdueBalanceCents,
    averageSettlementDays,
  };
}
