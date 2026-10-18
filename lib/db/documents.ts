import { getDb, getInvoiceById, getInvoiceByToken, getOrganizationById, InvoiceRecord } from "./index";
import {
  AttachmentInput,
  DocumentInput,
  insertAttachment,
  insertDocument,
  logEvent,
  todayISO,
  uid,
  uniqueNumber,
} from "./session2";
import {
  addDays,
  computeLateFee,
  computePaymentSchedule,
  daysBetween,
  formatCents,
  isOverdueBeyondGrace,
  planEstimateConversion,
} from "../math/calculator";

type Row = Record<string, any>;
type Result = { ok: boolean; error?: string; invoice?: InvoiceRecord; converted?: InvoiceRecord | null; amountCents?: number; feeCents?: number };

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function insertRow(table: string, row: Row) {
  const db = getDb();
  const keys = Object.keys(row);
  db.prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`).run(
    ...keys.map((k) => row[k])
  );
}

export function scheduleOf(d: Row) {
  return computePaymentSchedule({
    totalAmountCents: d.total_amount_cents,
    depositEnabled: !!d.deposit_enabled,
    depositAmountCents: d.deposit_amount_cents,
    amountPaidCents: d.amount_paid_cents,
  });
}

// ------------------------------------------------------------------ create
export function createDocument(input: DocumentInput): InvoiceRecord {
  const db = getDb();
  const org = getOrganizationById(input.organization_id);
  const id = insertDocument(db, {
    ...input,
    stripe_connected_account_id: input.stripe_connected_account_id ?? org?.stripe_v2_account_id ?? null,
  });
  return getInvoiceById(id)!;
}

// ------------------------------------------------------------------ lifecycle
export function setDocumentStatus(id: string, status: "sent" | "approved" | "declined" | "draft"): Result {
  const db = getDb();
  const doc = getInvoiceById(id);
  if (!doc) return { ok: false, error: "Document not found" };
  if (status === "approved") return approveEstimate(id, "contractor");
  if (status === "sent") {
    db.prepare("UPDATE invoices SET document_status='sent', sent_at=datetime('now'), updated_at=datetime('now') WHERE id=?").run(id);
    logEvent(db, id, doc.organization_id, "invoice_sent_sandbox", "contractor",
      `${doc.document_type === "estimate" ? "Estimate" : "Invoice"} link dispatched to customer (Sandbox: /${doc.document_type === "estimate" ? "e" : "i"}/${doc.public_token})`);
  } else {
    db.prepare("UPDATE invoices SET document_status=?, updated_at=datetime('now') WHERE id=?").run(status, id);
    logEvent(db, id, doc.organization_id, status === "declined" ? "estimate_declined" : "invoice_edited",
      status === "declined" ? "customer" : "contractor", `Document status changed to ${status}`);
  }
  return { ok: true, invoice: getInvoiceById(id)! };
}

export function markViewed(token: string): InvoiceRecord | null {
  const db = getDb();
  const doc = getInvoiceByToken(token);
  if (!doc) return null;
  if (doc.document_status === "sent") {
    db.prepare("UPDATE invoices SET document_status='viewed' WHERE id=?").run(doc.id);
  }
  const seen = db.prepare("SELECT 1 FROM invoice_events WHERE invoice_id=? AND event_type='public_page_viewed'").get(doc.id);
  if (!seen && doc.document_status !== "draft") {
    logEvent(db, doc.id, doc.organization_id, "public_page_viewed", "customer", `Customer opened public page /${doc.document_type === "estimate" ? "e" : "i"}/${doc.public_token}`);
  }
  return getInvoiceById(doc.id);
}

export function approveEstimate(id: string, actor: "customer" | "contractor" = "customer"): Result {
  const db = getDb();
  const doc = getInvoiceById(id);
  if (!doc) return { ok: false, error: "Document not found" };
  if (doc.document_type !== "estimate") return { ok: false, error: "Only estimates can be approved" };
  if (["declined", "expired"].includes(doc.document_status)) return { ok: false, error: `Estimate is ${doc.document_status}` };
  if (doc.document_status === "draft") return { ok: false, error: "Estimate has not been sent" };
  if (!["approved", "invoiced"].includes(doc.document_status)) {
    db.prepare("UPDATE invoices SET document_status='approved', updated_at=datetime('now') WHERE id=?").run(id);
    logEvent(db, id, doc.organization_id, "estimate_approved", actor, `Estimate ${doc.custom_code} approved by ${actor}`);
  }
  let converted: InvoiceRecord | null = null;
  const fresh = getInvoiceById(id)!;
  if (fresh.auto_convert_on_approval && fresh.document_status === "approved") {
    const r = convertEstimateToInvoice(id);
    if (r.ok) converted = r.converted || null;
  }
  return { ok: true, invoice: getInvoiceById(id)!, converted };
}

export function declineEstimate(id: string): Result {
  const doc = getInvoiceById(id);
  if (!doc) return { ok: false, error: "Document not found" };
  if (doc.document_type !== "estimate") return { ok: false, error: "Only estimates can be declined" };
  if (["approved", "invoiced"].includes(doc.document_status)) return { ok: false, error: "Estimate already approved" };
  return setDocumentStatus(id, "declined");
}

// ------------------------------------------------------------------ conversion
export function convertEstimateToInvoice(id: string): Result {
  const db = getDb();
  const est = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as unknown as Row | undefined;
  if (!est) return { ok: false, error: "Estimate not found" };
  if (est.document_type !== "estimate") return { ok: false, error: "Document is not an estimate" };
  if (est.converted_invoice_id) {
    return { ok: true, invoice: getInvoiceById(id)!, converted: getInvoiceById(est.converted_invoice_id) };
  }
  if (["declined", "expired"].includes(est.document_status)) return { ok: false, error: `Cannot convert a ${est.document_status} estimate` };

  const lineItems = db.prepare("SELECT * FROM invoice_line_items WHERE invoice_id=? ORDER BY sort_order").all(id) as unknown as Row[];
  const attachments = db.prepare("SELECT * FROM document_attachments WHERE document_id=?").all(id) as unknown as Row[];
  const digits = String(est.custom_code || "").replace(/\D/g, "") || String(Date.now());
  const invoiceId = uid("inv");
  const plan = planEstimateConversion({
    estimate: est,
    lineItems,
    attachments,
    today: todayISO(),
    invoiceId,
    invoiceNumber: uniqueNumber(db, est.organization_id, `INV-${digits}`),
    publicToken: `tok_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`,
    idGen: uid,
  });

  db.exec("BEGIN");
  try {
    insertRow("invoices", plan.invoice);
    plan.lineItems.forEach((r) => insertRow("invoice_line_items", r));
    plan.attachments.forEach((r) => insertRow("document_attachments", r));
    plan.reminders.forEach((r) => insertRow("payment_reminders", r));
    db.prepare("UPDATE invoices SET document_status=?, converted_invoice_id=?, updated_at=datetime('now') WHERE id=?").run(
      plan.estimatePatch.document_status, plan.estimatePatch.converted_invoice_id, id
    );
    db.prepare("UPDATE payment_reminders SET status='canceled' WHERE document_id=? AND status='scheduled'").run(id);
    const meta = { estimate_id: id, invoice_id: invoiceId, attachments: plan.attachments.length, reminders: plan.reminders.length, deposit_enabled: !!est.deposit_enabled };
    logEvent(db, id, est.organization_id, "estimate_converted_to_invoice", "system",
      `Estimate ${est.custom_code} converted to invoice ${plan.invoice.invoice_number}`, meta);
    logEvent(db, invoiceId, est.organization_id, "estimate_converted_to_invoice", "system",
      `Created from estimate ${est.custom_code} (line items, attachments, deposit schedule, reminders and late-fee settings preserved)`, meta);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    return { ok: false, error: e instanceof Error ? e.message : "Conversion failed" };
  }
  return { ok: true, invoice: getInvoiceById(id)!, converted: getInvoiceById(invoiceId)! };
}

// ------------------------------------------------------------------ payments (sandbox, card-only)
export function recordPayment(id: string, kind: "deposit" | "balance" | "full"): Result {
  const db = getDb();
  const doc = getInvoiceById(id);
  if (!doc) return { ok: false, error: "Document not found" };
  if (doc.document_status === "draft") return { ok: false, error: "Document has not been sent" };
  if (doc.document_type === "estimate" && ["declined", "expired", "invoiced"].includes(doc.document_status)) {
    return { ok: false, error: `Estimate is ${doc.document_status}` };
  }
  const s = scheduleOf(doc);
  let amount = 0;
  if (kind === "deposit") {
    if (!doc.deposit_enabled || s.depositOutstandingCents <= 0) return { ok: false, error: "No deposit outstanding" };
    amount = s.depositOutstandingCents;
  } else if (kind === "balance") {
    if (s.depositOutstandingCents > 0) return { ok: false, error: "Deposit must be paid first" };
    amount = s.balanceOutstandingCents;
  } else {
    amount = s.totalOutstandingCents;
  }
  if (amount <= 0) return { ok: false, error: "Nothing to pay" };

  const paid = doc.amount_paid_cents + amount;
  const dep = s.depositAmountCents;
  const balance = Math.max(0, doc.total_amount_cents - paid);
  const done = balance === 0;
  db.prepare(
    `UPDATE invoices SET amount_paid_cents=?, deposit_paid_cents=?, balance_due_cents=?, payment_status=?,
       paid_at=CASE WHEN ? THEN datetime('now') ELSE paid_at END, updated_at=datetime('now') WHERE id=?`
  ).run(paid, Math.min(paid, dep), balance, done ? "succeeded" : "pending", done ? 1 : 0, id);
  logEvent(db, id, doc.organization_id, done ? "payment_succeeded" : "deposit_paid", "customer",
    `${kind === "deposit" ? "Deposit" : kind === "balance" ? "Remaining balance" : "Full amount"} of ${formatCents(amount)} paid by card (Sandbox Direct Charge)`,
    { kind, amount_cents: amount });

  let converted: InvoiceRecord | null = null;
  if (doc.document_type === "estimate" && !["approved", "invoiced"].includes(doc.document_status)) {
    const r = approveEstimate(id, "customer");
    converted = r.converted || null;
  } else if (doc.document_type === "estimate" && doc.document_status === "approved" && doc.auto_convert_on_approval) {
    const r = convertEstimateToInvoice(id);
    converted = r.converted || null;
  }
  return { ok: true, amountCents: amount, invoice: getInvoiceById(id)!, converted };
}

// ------------------------------------------------------------------ late fees
export function applyLateFee(id: string, opts: { simulate?: boolean; today?: string } = {}): Result {
  const db = getDb();
  const doc = getInvoiceById(id);
  if (!doc) return { ok: false, error: "Document not found" };
  if (doc.document_type !== "invoice") return { ok: false, error: "Late fees apply to invoices only" };
  if (!doc.late_fee_enabled) return { ok: false, error: "Late fees are not enabled" };
  if (doc.late_fee_applied_cents > 0) return { ok: false, error: "Late fee already applied" };
  const s = scheduleOf(doc);
  if (s.totalOutstandingCents <= 0) return { ok: false, error: "Nothing overdue" };

  const useDeposit = s.depositOutstandingCents > 0;
  const dueDate = useDeposit ? addDays(doc.issue_date, doc.deposit_due_days) : doc.due_date;
  const base = useDeposit ? s.depositOutstandingCents : s.balanceOutstandingCents;
  let today = opts.today || todayISO();
  if (opts.simulate && !isOverdueBeyondGrace(today, dueDate, doc.late_fee_grace_days)) {
    today = addDays(dueDate, Math.max(1, doc.late_fee_grace_days));
  }
  if (!isOverdueBeyondGrace(today, dueDate, doc.late_fee_grace_days)) return { ok: false, error: "Not overdue beyond grace period" };

  const fee = computeLateFee({ type: doc.late_fee_type, value: doc.late_fee_value, overdueBaseCents: base });
  if (fee <= 0) return { ok: false, error: "Computed late fee is zero" };
  const total = doc.total_amount_cents + fee;
  db.prepare(
    `UPDATE invoices SET late_fee_applied_cents=?, total_amount_cents=?, balance_due_cents=?, updated_at=datetime('now') WHERE id=?`
  ).run(fee, total, Math.max(0, total - doc.amount_paid_cents), id);
  logEvent(db, id, doc.organization_id, "late_fee_applied", opts.simulate ? "contractor" : "system",
    `Late fee of ${formatCents(fee)} added (${doc.late_fee_type === "percentage" ? `${doc.late_fee_value}% of ${formatCents(base)} overdue ${useDeposit ? "deposit" : "balance"}` : "flat fee"}, ${daysBetween(dueDate, today)} days past due)${opts.simulate ? " [simulated]" : ""}`,
    { fee_cents: fee, base_cents: base, stage: useDeposit ? "deposit" : "balance", simulated: !!opts.simulate });
  return { ok: true, feeCents: fee, invoice: getInvoiceById(id)! };
}

// ------------------------------------------------------------------ reminders
export function runReminders(opts: { orgId?: string; force?: boolean; today?: string } = {}) {
  const db = getDb();
  const today = opts.today || todayISO();
  let sql = `SELECT r.id as rid, r.target_stage, r.trigger_key, r.scheduled_for, i.*
             FROM payment_reminders r JOIN invoices i ON i.id = r.document_id
             WHERE r.status='scheduled'`;
  const params: any[] = [];
  if (opts.orgId) { sql += " AND r.organization_id = ?"; params.push(opts.orgId); }
  if (!opts.force) { sql += " AND r.scheduled_for <= ?"; params.push(today); }
  const rows = db.prepare(sql).all(...params) as unknown as Row[];

  const out = { sent: 0, skipped_paid: 0, canceled: 0, lateFeesApplied: 0, deferred: 0 };
  for (const r of rows) {
    const s = scheduleOf(r);
    let status: "sent" | "skipped_paid" | "canceled" | null = "sent";
    if (r.document_status === "draft") status = null;
    else if (r.target_stage === "estimate_approval") {
      if (["approved", "invoiced"].includes(r.document_status)) status = "skipped_paid";
      else if (["declined", "expired"].includes(r.document_status)) status = "canceled";
    } else if (r.target_stage === "deposit_payment") {
      if (s.depositOutstandingCents <= 0) status = "skipped_paid";
    } else if (s.balanceOutstandingCents <= 0 || r.payment_status === "refunded") status = "skipped_paid";

    if (status === null) { out.deferred++; continue; }
    db.prepare("UPDATE payment_reminders SET status=?, sent_at=CASE WHEN ?='sent' THEN datetime('now') ELSE sent_at END WHERE id=?").run(status, status, r.rid);
    if (status === "sent") {
      out.sent++;
      const label = r.target_stage === "estimate_approval" ? "approval" : r.target_stage === "deposit_payment" ? "deposit" : "balance";
      logEvent(db, r.id, r.organization_id, "reminder_sent", "system",
        `Reminder sent (${r.trigger_key}) — ${label} reminder to customer (Sandbox: no real email/SMS)`,
        { reminder_id: r.rid, target_stage: r.target_stage });
    } else if (status === "skipped_paid") out.skipped_paid++;
    else out.canceled++;
  }

  // Auto-apply late fees to overdue invoices (works with deposit schedules).
  let lf = "SELECT id FROM invoices WHERE document_type='invoice' AND late_fee_enabled=1 AND late_fee_applied_cents=0 AND document_status<>'draft'";
  const lp: any[] = [];
  if (opts.orgId) { lf += " AND organization_id = ?"; lp.push(opts.orgId); }
  for (const d of db.prepare(lf).all(...lp) as unknown as Row[]) {
    if (applyLateFee(d.id, { today }).ok) out.lateFeesApplied++;
  }
  return out;
}

// ------------------------------------------------------------------ attachments
export function addAttachment(id: string, a: AttachmentInput): { ok: boolean; error?: string } {
  const db = getDb();
  const doc = getInvoiceById(id);
  if (!doc) return { ok: false, error: "Document not found" };
  if (!(a.mime_type.startsWith("image/") || a.mime_type === "application/pdf")) return { ok: false, error: "Only images and PDFs are allowed" };
  if (a.file_size_bytes > MAX_ATTACHMENT_BYTES) return { ok: false, error: "File exceeds 5 MB limit" };
  if (!a.data_url_or_path.startsWith("data:")) return { ok: false, error: "Invalid file payload" };
  insertAttachment(db, id, doc.organization_id, a);
  return { ok: true };
}
