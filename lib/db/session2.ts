import type { DatabaseSync } from "node:sqlite";
import type {
  DocumentType,
  DepositType,
  LateFeeType,
  ReminderRules,
} from "../math/calculator.ts";
import {
  DEFAULT_REMINDER_RULES,
  addDays,
  buildReminderSchedule,
  computeDepositSplit,
  computeInvoiceTotals,
  formatCents,
} from "../math/calculator.ts";

type Row = Record<string, any>;

export const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export const todayISO = () => new Date().toISOString().split("T")[0];

// ------------------------------------------------------------------ migrations (idempotent)
export function migrateSession2(db: DatabaseSync) {
  const addCols = (table: string, cols: Record<string, string>) => {
    const have = new Set(
      (db.prepare(`PRAGMA table_info(${table})`).all() as unknown as Row[]).map((r) => r.name as string)
    );
    for (const [name, ddl] of Object.entries(cols)) {
      if (!have.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${ddl}`);
    }
  };

  addCols("invoices", {
    document_type: "TEXT NOT NULL DEFAULT 'invoice'",
    project_title: "TEXT",
    custom_code: "TEXT",
    cc_emails: "TEXT DEFAULT '[]'",
    client_message: "TEXT",
    auto_convert_on_approval: "INTEGER NOT NULL DEFAULT 0",
    deposit_enabled: "INTEGER NOT NULL DEFAULT 0",
    deposit_type: "TEXT NOT NULL DEFAULT 'percentage'",
    deposit_value: "REAL NOT NULL DEFAULT 0",
    deposit_amount_cents: "INTEGER NOT NULL DEFAULT 0",
    deposit_due_days: "INTEGER NOT NULL DEFAULT 0",
    deposit_paid_cents: "INTEGER NOT NULL DEFAULT 0",
    balance_due_days: "INTEGER NOT NULL DEFAULT 14",
    late_fee_enabled: "INTEGER NOT NULL DEFAULT 0",
    late_fee_type: "TEXT NOT NULL DEFAULT 'flat_cents'",
    late_fee_value: "REAL NOT NULL DEFAULT 0",
    late_fee_grace_days: "INTEGER NOT NULL DEFAULT 3",
    late_fee_applied_cents: "INTEGER NOT NULL DEFAULT 0",
    reminder_rules: "TEXT",
    expires_at: "TEXT",
    converted_from_id: "TEXT",
    converted_invoice_id: "TEXT",
    sent_at: "TEXT",
  });
  addCols("invoice_line_items", { note: "TEXT" });
  addCols("organizations", {
    logo_format: "TEXT NOT NULL DEFAULT 'framed'",
    default_footer_message: "TEXT DEFAULT 'Thank you for your business!'",
  });

  db.exec(`
    CREATE TABLE IF NOT EXISTS document_attachments (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      uploaded_by_role TEXT NOT NULL CHECK (uploaded_by_role IN ('contractor','client')),
      uploader_name TEXT,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL DEFAULT 0,
      data_url_or_path TEXT NOT NULL,
      caption TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_attachments_doc ON document_attachments(document_id);

    CREATE TABLE IF NOT EXISTS payment_reminders (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      target_stage TEXT NOT NULL CHECK (target_stage IN ('estimate_approval','deposit_payment','balance_payment')),
      trigger_key TEXT,
      trigger_offset_days INTEGER NOT NULL,
      scheduled_for TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','sent','skipped_paid','canceled')),
      sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_reminders_due ON payment_reminders(status, scheduled_for);
  `);
}

// ------------------------------------------------------------------ document insert (shared by API + seed)
export interface AttachmentInput {
  uploaded_by_role?: "contractor" | "client";
  uploader_name?: string | null;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  data_url_or_path: string;
  caption?: string | null;
}

export interface DocumentInput {
  id?: string;
  organization_id: string;
  customer_id: string;
  document_type: DocumentType;
  invoice_number?: string;
  public_token?: string;
  project_title?: string | null;
  custom_code?: string | null;
  cc_emails?: string[];
  client_message?: string | null;
  auto_convert_on_approval?: boolean;
  document_status?: string;
  issue_date: string;
  expires_days?: number;
  expires_at?: string | null;
  tax_rate: number;
  discount_cents?: number;
  notes?: string | null;
  creation_source?: string;
  ai_model_used?: string | null;
  ai_human_confirmed?: boolean;
  deposit_enabled?: boolean;
  deposit_type?: DepositType;
  deposit_value?: number;
  deposit_due_days?: number;
  balance_due_days?: number;
  late_fee_enabled?: boolean;
  late_fee_type?: LateFeeType;
  late_fee_value?: number;
  late_fee_grace_days?: number;
  reminder_rules?: ReminderRules;
  amount_paid_cents?: number;
  stripe_connected_account_id?: string | null;
  line_items: { description: string; category?: string; quantity: number; unit_price_cents: number; note?: string | null }[];
  attachments?: AttachmentInput[];
}

export function logEvent(
  db: DatabaseSync,
  invoiceId: string,
  orgId: string,
  eventType: string,
  actor: string,
  summary: string,
  metadata?: unknown
) {
  db.prepare(
    "INSERT INTO invoice_events (id, invoice_id, organization_id, event_type, actor, summary, metadata) VALUES (?,?,?,?,?,?,?)"
  ).run(uid("evt"), invoiceId, orgId, eventType, actor, summary, metadata ? JSON.stringify(metadata) : "{}");
}

function nextCode(db: DatabaseSync, orgId: string): string {
  const rows = db.prepare("SELECT custom_code FROM invoices WHERE organization_id = ? AND custom_code IS NOT NULL").all(orgId) as unknown as Row[];
  let max = 1000;
  for (const r of rows) {
    const n = parseInt(String(r.custom_code).replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `#${max + 1}`;
}

export function uniqueNumber(db: DatabaseSync, orgId: string, base: string): string {
  let n = base;
  let i = 2;
  while (db.prepare("SELECT 1 FROM invoices WHERE organization_id = ? AND invoice_number = ?").get(orgId, n)) {
    n = `${base}-${i++}`;
  }
  return n;
}

export function insertDocument(db: DatabaseSync, input: DocumentInput): string {
  const isEstimate = input.document_type === "estimate";
  const id = input.id || uid(isEstimate ? "est" : "inv");
  const org = input.organization_id;
  const code = input.custom_code || nextCode(db, org);
  const digits = code.replace(/\D/g, "") || id;
  const number = input.invoice_number || uniqueNumber(db, org, `${isEstimate ? "EST" : "INV"}-${digits}`);

  const totals = computeInvoiceTotals({
    lineItems: input.line_items.map((l) => ({ quantity: l.quantity, unitPriceCents: l.unit_price_cents })),
    discountCents: input.discount_cents,
    taxRatePercent: input.tax_rate,
    amountPaidCents: input.amount_paid_cents || 0,
  });
  const depEnabled = !!input.deposit_enabled;
  const depType = input.deposit_type || "percentage";
  const depValue = input.deposit_value || 0;
  const dep = depEnabled
    ? computeDepositSplit(totals.totalAmountCents, depType, depValue).depositAmountCents
    : 0;
  const depositDays = input.deposit_due_days ?? 0;
  const balanceDays = input.balance_due_days ?? 14;
  const issue = input.issue_date;
  const dueDate = addDays(issue, balanceDays);
  const expiresAt = isEstimate ? input.expires_at ?? addDays(issue, input.expires_days ?? 30) : null;
  const rules = input.reminder_rules || DEFAULT_REMINDER_RULES;
  const status = input.document_status || "draft";
  const paid = totals.amountPaidCents;

  const row: Row = {
    id,
    organization_id: org,
    customer_id: input.customer_id,
    invoice_number: number,
    public_token: input.public_token || `tok_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`,
    document_type: input.document_type,
    document_status: status,
    payment_status: "pending",
    issue_date: issue,
    due_date: dueDate,
    currency: "USD",
    subtotal_cents: totals.subtotalCents,
    discount_cents: totals.discountCents,
    tax_rate: input.tax_rate,
    tax_amount_cents: totals.taxAmountCents,
    total_amount_cents: totals.totalAmountCents,
    amount_paid_cents: paid,
    amount_refunded_cents: 0,
    balance_due_cents: totals.balanceDueCents,
    stripe_connected_account_id: input.stripe_connected_account_id || null,
    creation_source: input.creation_source || "manual",
    ai_model_used: input.ai_model_used || null,
    ai_human_confirmed: input.ai_human_confirmed ? 1 : 0,
    notes: input.notes || null,
    project_title: input.project_title || null,
    custom_code: code,
    cc_emails: JSON.stringify(input.cc_emails || []),
    client_message: input.client_message ?? "We look forward to working with you. Thank you for your business.",
    auto_convert_on_approval: input.auto_convert_on_approval ? 1 : 0,
    deposit_enabled: depEnabled ? 1 : 0,
    deposit_type: depType,
    deposit_value: depValue,
    deposit_amount_cents: dep,
    deposit_due_days: depositDays,
    deposit_paid_cents: Math.min(paid, dep),
    balance_due_days: balanceDays,
    late_fee_enabled: input.late_fee_enabled ? 1 : 0,
    late_fee_type: input.late_fee_type || "flat_cents",
    late_fee_value: input.late_fee_value || 0,
    late_fee_grace_days: input.late_fee_grace_days ?? 3,
    late_fee_applied_cents: 0,
    reminder_rules: JSON.stringify(rules),
    expires_at: expiresAt,
    sent_at: status === "draft" ? null : `${issue} 09:00:00`,
  };
  const keys = Object.keys(row);
  db.prepare(`INSERT INTO invoices (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`).run(...keys.map((k) => row[k]));

  input.line_items.forEach((li, idx) => {
    db.prepare(
      `INSERT INTO invoice_line_items (id, invoice_id, organization_id, sort_order, category, description, note, quantity, unit_price_cents, line_total_cents)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).run(
      uid("item"), id, org, idx, li.category || "service", li.description, li.note || null,
      li.quantity, li.unit_price_cents, Math.round(li.quantity * li.unit_price_cents)
    );
  });

  const sched = buildReminderSchedule({
    documentType: input.document_type,
    enabled: rules.enabled,
    triggerKeys: isEstimate ? rules.estimate : rules.invoice,
    sentDate: issue,
    expiryDate: expiresAt,
    depositEnabled: depEnabled,
    depositDueDate: addDays(issue, depositDays),
    balanceDueDate: dueDate,
  });
  for (const r of sched) {
    db.prepare(
      `INSERT INTO payment_reminders (id, document_id, organization_id, target_stage, trigger_key, trigger_offset_days, scheduled_for, status)
       VALUES (?,?,?,?,?,?,?, 'scheduled')`
    ).run(uid("rem"), id, org, r.target_stage, r.trigger_key, r.trigger_offset_days, r.scheduled_for);
  }

  const label = isEstimate ? "Estimate" : "Invoice";
  logEvent(db, id, org, "invoice_created", "contractor",
    `${label} ${code} created (${formatCents(totals.totalAmountCents)}${depEnabled ? `, ${formatCents(dep)} deposit requested` : ""})`);
  if (input.ai_human_confirmed) {
    logEvent(db, id, org, "ai_extraction_confirmed", "contractor",
      `AI extraction confirmed by contractor (Model: ${input.ai_model_used || "gemini-3.8-flash"})`);
  }
  for (const a of input.attachments || []) insertAttachment(db, id, org, a);
  return id;
}

export function insertAttachment(db: DatabaseSync, docId: string, orgId: string, a: AttachmentInput) {
  const role = a.uploaded_by_role || "contractor";
  db.prepare(
    `INSERT INTO document_attachments (id, document_id, organization_id, uploaded_by_role, uploader_name, file_name, mime_type, file_size_bytes, data_url_or_path, caption)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(uid("att"), docId, orgId, role, a.uploader_name || null, a.file_name, a.mime_type, a.file_size_bytes, a.data_url_or_path, a.caption || null);
  logEvent(db, docId, orgId, "attachment_uploaded", role, `${role === "client" ? "Client" : "Contractor"} attached ${a.file_name}${a.caption ? ` — "${a.caption}"` : ""}`, { file_name: a.file_name, mime_type: a.mime_type });
}

// ------------------------------------------------------------------ seed
const PIXEL_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export function seedSession2(db: DatabaseSync) {
  const today = todayISO();
  const hasOrg = (id: string) => !!db.prepare("SELECT 1 FROM organizations WHERE id = ?").get(id);
  const hasCust = (id: string) => !!db.prepare("SELECT 1 FROM customers WHERE id = ?").get(id);

  // 1. Ensure diverse business tenants exist
  // Tenant A: 5 Star Plumbing Service
  if (!hasOrg("org_5star_01")) {
    db.prepare(`
      INSERT INTO organizations (
        id, name, slug, owner_id, business_email, business_phone, business_address,
        brand_primary_color, default_tax_rate, default_payment_terms_days,
        stripe_v2_account_id, stripe_v2_merchant_capability_status, logo_format, default_footer_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "org_5star_01",
      "5 Star plumbing service",
      "5star-plumbing",
      "usr_5star_admin",
      "5starplumbing05@gmail.com",
      "(786) 606-6944",
      "Miami, FL 33166",
      "#65C466",
      0.0,
      14,
      "acct_1NqZ5StarDirect",
      "active_test",
      "framed",
      "Thank you for your business!"
    );
  } else {
    db.prepare(`UPDATE organizations SET name = '5 Star plumbing service', business_email = '5starplumbing05@gmail.com', business_phone = '(786) 606-6944', brand_primary_color = '#65C466' WHERE id = 'org_5star_01'`).run();
  }

  // Tenant B: Nova Digital & Design Studio (Freelance / Agency example)
  if (!hasOrg("org_nova_02")) {
    db.prepare(`
      INSERT INTO organizations (
        id, name, slug, owner_id, business_email, business_phone, business_address,
        brand_primary_color, default_tax_rate, default_payment_terms_days,
        stripe_v2_account_id, stripe_v2_merchant_capability_status, logo_format, default_footer_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "org_nova_02",
      "Nova Digital & Design Studio",
      "nova-digital",
      "usr_nova_lead",
      "hello@novadesign.example",
      "(415) 555-0182",
      "580 Howard St, San Francisco, CA 94105",
      "#7C3AED",
      0.0,
      14,
      "acct_1NqZNovaDirect",
      "active_test",
      "full",
      "Thank you for partnering with Nova Digital."
    );
  }

  // Tenant C: Apex Advisory & Consulting (Professional Services / Consultant example)
  if (hasOrg("org_apex_01")) {
    db.prepare(`UPDATE organizations SET name = 'Apex Advisory & Consulting', business_email = 'advisory@apexadvisors.preview' WHERE id = 'org_apex_01'`).run();
  }

  // 2. Customers for 5 Star Plumbing Service
  if (!hasCust("cust_tatiana_ruiz")) {
    db.prepare(`
      INSERT INTO customers (id, organization_id, name, company_name, email, phone, service_address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "cust_tatiana_ruiz",
      "org_5star_01",
      "Tatiana Ruiz",
      null,
      "tatiana.ruiz@example.com",
      "(404) 952-3973",
      "4499 NW 82nd Ave, Doral, FL 33166",
      "Master bedroom shower drain service."
    );
  }

  if (!hasCust("cust_sergio_espinoza")) {
    db.prepare(`
      INSERT INTO customers (id, organization_id, name, company_name, email, phone, service_address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "cust_sergio_espinoza",
      "org_5star_01",
      "Sergio Espinoza",
      null,
      "sergio.e@example.com",
      "(919) 986-1719",
      "1200 Brickell Ave, Miami, FL 33131",
      "Commercial suite kitchen plumbing."
    );
  }

  if (!hasCust("cust_eglee_valdes")) {
    db.prepare(`
      INSERT INTO customers (id, organization_id, name, company_name, email, phone, service_address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "cust_eglee_valdes",
      "org_5star_01",
      "Eglee Valdes",
      null,
      "eglee.valdes@example.com",
      "(786) 255-6488",
      "780 Ocean Dr, Miami Beach, FL 33139",
      "Main water shutoff inspection."
    );
  }

  // Customer Marisol Vega (can be associated with org_5star_01 as well)
  if (!hasCust("cust_marisol_vega_5s")) {
    db.prepare(`
      INSERT INTO customers (id, organization_id, name, company_name, email, phone, service_address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "cust_marisol_vega_5s",
      "org_5star_01",
      "Marisol Vega",
      null,
      "marisol@example.com",
      "(305) 555-0172",
      "3920 Garden Ave, Miami Beach, FL 33140",
      "Prefers Spanish-language estimates."
    );
  }

  // 3. Seed Invoice #5033 under 5 Star Plumbing Service
  if (!db.prepare("SELECT 1 FROM invoices WHERE custom_code = '#5033'").get()) {
    insertDocument(db, {
      id: "inv_5star_5033",
      organization_id: "org_5star_01",
      customer_id: "cust_tatiana_ruiz",
      document_type: "invoice",
      invoice_number: "INV-5033",
      public_token: "tok_5star_5033_shower",
      custom_code: "#5033",
      project_title: "Shower drain unclogged",
      document_status: "sent",
      issue_date: "2026-10-09",
      tax_rate: 0,
      client_message: "Thank you for your business!",
      amount_paid_cents: 16000,
      stripe_connected_account_id: "acct_1NqZ5StarDirect",
      line_items: [
        {
          description: "Master bedroom showerdrain unclogged",
          category: "service",
          quantity: 1,
          unit_price_cents: 16000,
          note: "Ran 25 ft of snake through shower drain for clearance.",
        },
      ],
    });

    // Mark paid in full via Mastercard 3221 on Oct 9, 2026
    db.prepare(`
      UPDATE invoices
      SET payment_status = 'succeeded',
          amount_paid_cents = 16000,
          balance_due_cents = 0,
          paid_at = '2026-10-09 14:30:00',
          payment_method_type = 'Mastercard 3221'
      WHERE id = 'inv_5star_5033'
    `).run();

    logEvent(
      db,
      "inv_5star_5033",
      "org_5star_01",
      "payment_succeeded",
      "customer",
      "Paid in full ($160.00) via Mastercard 3221 on Oct 9, 2026",
      { card_brand: "Mastercard", last4: "3221", paid_date: "2026-10-09" }
    );
  }

  // 4. Also seed Estimate #3060 under 5 Star Plumbing Service if not already seeded
  if (!db.prepare("SELECT 1 FROM invoices WHERE organization_id = 'org_5star_01' AND custom_code = '#3060'").get()) {
    insertDocument(db, {
      id: "est_5star_3060",
      organization_id: "org_5star_01",
      customer_id: "cust_marisol_vega_5s",
      document_type: "estimate",
      public_token: "tok_est_3060_5star",
      custom_code: "#3060",
      project_title: "3920 Garden Ave, Miami Beach, FL 33140",
      document_status: "sent",
      issue_date: today,
      expires_days: 30,
      tax_rate: 0,
      auto_convert_on_approval: true,
      deposit_enabled: true,
      deposit_type: "flat_cents",
      deposit_value: 291396,
      deposit_due_days: 0,
      balance_due_days: 1,
      late_fee_enabled: true,
      late_fee_type: "percentage",
      late_fee_value: 5,
      late_fee_grace_days: 3,
      stripe_connected_account_id: "acct_1NqZ5StarDirect",
      line_items: [
        { description: "Calentador Bradford White RG275H6N", category: "equipment", quantity: 1, unit_price_cents: 183896, note: "Gas water heater, 50 gal" },
        { description: "Cargo de conveniencia / compra", category: "service", quantity: 1, unit_price_cents: 12500 },
        { description: "Reemplazo de Water heater", category: "labor", quantity: 1, unit_price_cents: 190000, note: "Includes haul-away of old unit" },
      ],
      attachments: [
        { uploaded_by_role: "contractor", uploader_name: "5 Star Plumbing Service", file_name: "water-heater-model-plate.png", mime_type: "image/png", file_size_bytes: 70, data_url_or_path: PIXEL_PNG, caption: "Existing unit model plate" },
      ],
    });
  }

  if (db.prepare("SELECT 1 FROM invoices WHERE custom_code = '#3060' AND organization_id = 'org_vanguard_03'").get()) return;

  if (!hasCust("cust_vanguard_c2")) {
    db.prepare(
      `INSERT INTO customers (id, organization_id, name, company_name, email, phone, service_address, notes) VALUES (?,?,?,?,?,?,?,?)`
    ).run("cust_vanguard_c2", "org_vanguard_03", "Marisol Vega", null, "marisol@example.com", "(305) 555-0172",
      "3920 Garden Ave, Miami Beach, FL 33140", "Prefers Spanish-language estimates.");
  }

  // Estimate #3060 — exact figures from the Session 2 spec ($3,863.96 total)
  insertDocument(db, {
    id: "est_vanguard_3060",
    organization_id: "org_vanguard_03",
    customer_id: "cust_vanguard_c2",
    document_type: "estimate",
    public_token: "tok_est_3060_water_heater",
    custom_code: "#3060",
    project_title: "3920 Garden Ave, Miami Beach, FL 33140",
    document_status: "sent",
    issue_date: today,
    expires_days: 30,
    tax_rate: 0,
    auto_convert_on_approval: true,
    deposit_enabled: true,
    deposit_type: "flat_cents",
    deposit_value: 291396,
    deposit_due_days: 0,
    balance_due_days: 1,
    late_fee_enabled: true,
    late_fee_type: "percentage",
    late_fee_value: 5,
    late_fee_grace_days: 3,
    stripe_connected_account_id: "acct_1NqZVanguardV2Direct",
    line_items: [
      { description: "Calentador Bradford White RG275H6N", category: "equipment", quantity: 1, unit_price_cents: 183896, note: "Gas water heater, 50 gal" },
      { description: "Cargo de conveniencia / compra", category: "service", quantity: 1, unit_price_cents: 12500 },
      { description: "Reemplazo de Water heater", category: "labor", quantity: 1, unit_price_cents: 190000, note: "Includes haul-away of old unit" },
    ],
    attachments: [
      { uploaded_by_role: "contractor", uploader_name: "Vanguard Plumbing", file_name: "water-heater-model-plate.png", mime_type: "image/png", file_size_bytes: 70, data_url_or_path: PIXEL_PNG, caption: "Existing unit model plate" },
    ],
  });

  insertDocument(db, {
    organization_id: "org_vanguard_03",
    customer_id: "cust_vanguard_c1",
    document_type: "estimate",
    custom_code: "#3057",
    project_title: "440 Terry Ave N, Seattle, WA 98109",
    document_status: "sent",
    issue_date: addDays(today, -45),
    expires_days: 30,
    tax_rate: 10.25,
    balance_due_days: 14,
    line_items: [{ description: "Grease trap service & backflow test", category: "service", quantity: 1, unit_price_cents: 84000 }],
  });

  insertDocument(db, {
    organization_id: "org_apex_01",
    customer_id: "cust_apex_c2",
    document_type: "estimate",
    custom_code: "#2050",
    project_title: "1020 E 6th St, Austin, TX 78702",
    document_status: "viewed",
    issue_date: addDays(today, -3),
    tax_rate: 8.25,
    deposit_enabled: true,
    deposit_type: "percentage",
    deposit_value: 30,
    balance_due_days: 14,
    stripe_connected_account_id: "acct_1NqZApexV2Direct",
    line_items: [
      { description: "Compressor subpanel feeder upgrade", category: "labor", quantity: 8, unit_price_cents: 14000 },
      { description: "100A subpanel & breakers", category: "material", quantity: 1, unit_price_cents: 62000 },
    ],
  });

  insertDocument(db, {
    organization_id: "org_apex_01",
    customer_id: "cust_apex_c1",
    document_type: "estimate",
    custom_code: "#2051",
    project_title: "701 Brazos St, Austin, TX 78701",
    document_status: "approved",
    issue_date: addDays(today, -6),
    tax_rate: 8.25,
    line_items: [{ description: "Lobby emergency lighting retrofit", category: "service", quantity: 1, unit_price_cents: 215000 }],
  });

  // Invoice with deposit paid + late fee enabled and balance now overdue (demonstrates late fee + deposit together)
  insertDocument(db, {
    id: "inv_apex_deposit_late",
    organization_id: "org_apex_01",
    customer_id: "cust_apex_c3",
    document_type: "invoice",
    public_token: "tok_apex_deposit_late",
    custom_code: "#2049",
    project_title: "1405 S Congress Ave, Austin, TX 78704",
    document_status: "sent",
    issue_date: addDays(today, -20),
    tax_rate: 8.25,
    deposit_enabled: true,
    deposit_type: "percentage",
    deposit_value: 30,
    deposit_due_days: 0,
    balance_due_days: 7,
    late_fee_enabled: true,
    late_fee_type: "percentage",
    late_fee_value: 5,
    late_fee_grace_days: 3,
    amount_paid_cents: 107168,
    stripe_connected_account_id: "acct_1NqZApexV2Direct",
    line_items: [
      { description: "Transformer pad relocation", category: "labor", quantity: 1, unit_price_cents: 250000 },
      { description: "Conduit, wire & hardware", category: "material", quantity: 1, unit_price_cents: 80000 },
    ],
  });
}
