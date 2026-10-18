/**
 * Deterministic math for Invoice Pro Agios (Session 2).
 * Self-contained (no imports) so the same code runs in Next.js, API routes and `node --test`.
 * All money is integer cents.
 */

export type DepositType = "percentage" | "flat_cents";
export type LateFeeType = "flat_cents" | "percentage";
export type DocumentType = "estimate" | "invoice";
type Row = Record<string, any>;

// ---------------------------------------------------------------- line items & totals
export interface LineItemInput {
  quantity: number;
  unitPriceCents: number;
}

export function computeLineTotalCents(quantity: number, unitPriceCents: number): number {
  if (quantity <= 0 || unitPriceCents <= 0) return 0;
  return Math.round(quantity * unitPriceCents);
}

export interface InvoiceTotalsInput {
  lineItems: LineItemInput[];
  discountCents?: number;
  taxRatePercent?: number;
  amountPaidCents?: number;
  lateFeeAppliedCents?: number;
}

export interface ComputedInvoiceTotals {
  subtotalCents: number;
  discountCents: number;
  taxRatePercent: number;
  taxAmountCents: number;
  lateFeeAppliedCents: number;
  totalAmountCents: number;
  amountPaidCents: number;
  balanceDueCents: number;
}

export function computeInvoiceTotals(input: InvoiceTotalsInput): ComputedInvoiceTotals {
  const lineItems = input.lineItems || [];
  const discountCents = Math.max(0, Math.round(input.discountCents || 0));
  const taxRatePercent = Math.max(0, Number(input.taxRatePercent || 0));
  const amountPaidCents = Math.max(0, Math.round(input.amountPaidCents || 0));
  const lateFeeAppliedCents = Math.max(0, Math.round(input.lateFeeAppliedCents || 0));

  const subtotalCents = lineItems.reduce(
    (acc, it) => acc + computeLineTotalCents(it.quantity, it.unitPriceCents),
    0
  );
  const taxableBaseCents = Math.max(0, subtotalCents - discountCents);
  const taxAmountCents = Math.round((taxableBaseCents * taxRatePercent) / 100);
  const totalAmountCents = Math.max(0, subtotalCents - discountCents + taxAmountCents + lateFeeAppliedCents);
  const balanceDueCents = Math.max(0, totalAmountCents - amountPaidCents);

  return {
    subtotalCents,
    discountCents,
    taxRatePercent,
    taxAmountCents,
    lateFeeAppliedCents,
    totalAmountCents,
    amountPaidCents,
    balanceDueCents,
  };
}

export function formatCents(cents: number | bigint | null | undefined): string {
  const num = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function parseDollarsToCents(str: string): number {
  if (!str) return 0;
  const val = parseFloat(String(str).replace(/[^0-9.-]/g, ""));
  return isNaN(val) ? 0 : Math.round(val * 100);
}

// ---------------------------------------------------------------- dates
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + Math.round(days)));
  return dt.toISOString().slice(0, 10);
}

/** whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(from.slice(0, 10) + "T00:00:00Z");
  const b = Date.parse(to.slice(0, 10) + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

export const DUE_PRESETS: { days: number; label: string }[] = [
  { days: 0, label: "Upon invoice date" },
  { days: 1, label: "1 day after invoice date" },
  { days: 7, label: "7 days after invoice date" },
  { days: 14, label: "14 days after invoice date" },
  { days: 30, label: "30 days after invoice date" },
];

export function dueDaysLabel(days: number): string {
  return DUE_PRESETS.find((p) => p.days === days)?.label || `${days} days after invoice date`;
}

// ---------------------------------------------------------------- deposits
export function computeDepositSplit(
  totalAmountCents: number,
  depositType: DepositType,
  depositValue: number
): { depositAmountCents: number; remainingBalanceCents: number } {
  const total = Math.max(0, Math.round(totalAmountCents));
  const value = Math.max(0, Number(depositValue) || 0);
  const depositAmountCents =
    depositType === "percentage"
      ? Math.round(total * (Math.min(value, 100) / 100))
      : Math.min(Math.round(value), total);
  return { depositAmountCents, remainingBalanceCents: total - depositAmountCents };
}

export interface ScheduleInput {
  totalAmountCents: number;
  depositEnabled: boolean;
  depositAmountCents: number;
  amountPaidCents: number;
}

export interface PaymentSchedule {
  depositAmountCents: number;
  remainingBalanceCents: number;
  depositPaidCents: number;
  depositOutstandingCents: number;
  balanceOutstandingCents: number;
  totalOutstandingCents: number;
  nextKind: "deposit" | "balance" | "none";
  nextAmountCents: number;
}

/** Payments always apply to the deposit first, then to the remaining balance. */
export function computePaymentSchedule(i: ScheduleInput): PaymentSchedule {
  const total = Math.max(0, i.totalAmountCents);
  const dep = i.depositEnabled ? Math.min(Math.max(0, i.depositAmountCents), total) : 0;
  const paid = Math.max(0, i.amountPaidCents);
  const depositPaidCents = Math.min(paid, dep);
  const depositOutstandingCents = dep - depositPaidCents;
  const remainingBalanceCents = total - dep;
  const balanceOutstandingCents = Math.max(0, remainingBalanceCents - Math.max(0, paid - dep));
  const nextKind = depositOutstandingCents > 0 ? "deposit" : balanceOutstandingCents > 0 ? "balance" : "none";
  return {
    depositAmountCents: dep,
    remainingBalanceCents,
    depositPaidCents,
    depositOutstandingCents,
    balanceOutstandingCents,
    totalOutstandingCents: Math.max(0, total - paid),
    nextKind,
    nextAmountCents: nextKind === "deposit" ? depositOutstandingCents : balanceOutstandingCents,
  };
}

export function describePaymentSchedule(totalAmountCents: number, depositAmountCents: number, balanceDueDays: number): string {
  return `Request ${formatCents(depositAmountCents)} deposit on ${formatCents(totalAmountCents)} total. Remaining balance of ${formatCents(
    totalAmountCents - depositAmountCents
  )} due in ${balanceDueDays} day${balanceDueDays === 1 ? "" : "s"}.`;
}

// ---------------------------------------------------------------- late fees
export function computeLateFee(input: { type: LateFeeType; value: number; overdueBaseCents: number }): number {
  const base = Math.max(0, Math.round(input.overdueBaseCents));
  if (base <= 0) return 0;
  const value = Math.max(0, Number(input.value) || 0);
  return input.type === "flat_cents" ? Math.round(value) : Math.round(base * (value / 100));
}

export function isOverdueBeyondGrace(today: string, dueDate: string, graceDays: number): boolean {
  return daysBetween(dueDate, today) >= Math.max(1, graceDays);
}

// ---------------------------------------------------------------- reminders
export interface ReminderTrigger {
  key: string;
  label: string;
  anchor: "sent" | "expiry" | "due";
  offset: number;
}

export const ESTIMATE_REMINDER_TRIGGERS: ReminderTrigger[] = [
  { key: "sent_plus_2", label: "2 days after sent (unopened/unapproved)", anchor: "sent", offset: 2 },
  { key: "expiry_minus_1", label: "1 day before expiration", anchor: "expiry", offset: -1 },
  { key: "expiry_0", label: "On expiration date", anchor: "expiry", offset: 0 },
];

export const INVOICE_REMINDER_TRIGGERS: ReminderTrigger[] = [
  { key: "due_-3", label: "3 days before due date", anchor: "due", offset: -3 },
  { key: "due_0", label: "On due date", anchor: "due", offset: 0 },
  { key: "due_1", label: "1 day overdue", anchor: "due", offset: 1 },
  { key: "due_3", label: "3 days overdue", anchor: "due", offset: 3 },
  { key: "due_7", label: "7 days overdue", anchor: "due", offset: 7 },
  { key: "due_14", label: "14 days overdue", anchor: "due", offset: 14 },
];

export interface ReminderRules {
  enabled: boolean;
  estimate: string[];
  invoice: string[];
}

export const DEFAULT_REMINDER_RULES: ReminderRules = {
  enabled: true,
  estimate: ["sent_plus_2", "expiry_minus_1", "expiry_0"],
  invoice: ["due_-3", "due_0", "due_3", "due_7"],
};

export function parseReminderRules(raw: unknown): ReminderRules {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (v && typeof v === "object") {
      const r = v as Partial<ReminderRules>;
      return {
        enabled: r.enabled !== false,
        estimate: Array.isArray(r.estimate) ? r.estimate : DEFAULT_REMINDER_RULES.estimate,
        invoice: Array.isArray(r.invoice) ? r.invoice : DEFAULT_REMINDER_RULES.invoice,
      };
    }
  } catch {
    /* fall through */
  }
  return { ...DEFAULT_REMINDER_RULES };
}

export interface ReminderRow {
  target_stage: "estimate_approval" | "deposit_payment" | "balance_payment";
  trigger_key: string;
  trigger_offset_days: number;
  scheduled_for: string;
}

export function buildReminderSchedule(i: {
  documentType: DocumentType;
  enabled: boolean;
  triggerKeys: string[];
  sentDate?: string;
  expiryDate?: string | null;
  depositEnabled?: boolean;
  depositDueDate?: string;
  balanceDueDate?: string;
}): ReminderRow[] {
  if (!i.enabled) return [];
  const rows: ReminderRow[] = [];
  if (i.documentType === "estimate") {
    for (const t of ESTIMATE_REMINDER_TRIGGERS) {
      if (!i.triggerKeys.includes(t.key)) continue;
      const anchor = t.anchor === "sent" ? i.sentDate : i.expiryDate;
      if (!anchor) continue;
      rows.push({
        target_stage: "estimate_approval",
        trigger_key: t.key,
        trigger_offset_days: t.offset,
        scheduled_for: addDays(anchor, t.offset),
      });
    }
    return rows;
  }
  for (const t of INVOICE_REMINDER_TRIGGERS) {
    if (!i.triggerKeys.includes(t.key)) continue;
    if (i.depositEnabled && i.depositDueDate) {
      rows.push({
        target_stage: "deposit_payment",
        trigger_key: t.key,
        trigger_offset_days: t.offset,
        scheduled_for: addDays(i.depositDueDate, t.offset),
      });
    }
    if (i.balanceDueDate) {
      rows.push({
        target_stage: "balance_payment",
        trigger_key: t.key,
        trigger_offset_days: t.offset,
        scheduled_for: addDays(i.balanceDueDate, t.offset),
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------- estimate -> invoice conversion
/**
 * Pure plan for converting an estimate into an invoice. Preserves line items, attachments,
 * deposit schedule, reminder rules and late-fee settings; re-anchors due dates to `today`.
 */
export function planEstimateConversion(input: {
  estimate: Row;
  lineItems: Row[];
  attachments: Row[];
  today: string;
  invoiceId: string;
  invoiceNumber: string;
  publicToken: string;
  idGen: (prefix: string) => string;
}) {
  const e = input.estimate;
  const rules = parseReminderRules(e.reminder_rules);
  const { created_at, updated_at, ...rest } = e;
  const balanceDays = e.balance_due_days ?? 14;
  const invoice: Row = {
    ...rest,
    id: input.invoiceId,
    invoice_number: input.invoiceNumber,
    public_token: input.publicToken,
    document_type: "invoice",
    document_status: "sent",
    converted_from_id: e.id,
    converted_invoice_id: null,
    auto_convert_on_approval: 0,
    issue_date: input.today,
    due_date: addDays(input.today, balanceDays),
    expires_at: null,
    reminder_rules: JSON.stringify(rules),
  };

  const lineItems = input.lineItems.map((li) => {
    const { created_at: _c, ...r } = li;
    return { ...r, id: input.idGen("item"), invoice_id: input.invoiceId };
  });

  const attachments = input.attachments.map((a) => {
    const { created_at: _c, ...r } = a;
    return { ...r, id: input.idGen("att"), document_id: input.invoiceId };
  });

  const reminders = buildReminderSchedule({
    documentType: "invoice",
    enabled: rules.enabled,
    triggerKeys: rules.invoice,
    depositEnabled: !!e.deposit_enabled,
    depositDueDate: addDays(input.today, e.deposit_due_days ?? 0),
    balanceDueDate: invoice.due_date,
  }).map((r) => ({
    ...r,
    id: input.idGen("rem"),
    document_id: input.invoiceId,
    organization_id: e.organization_id,
    status: "scheduled",
  }));

  return {
    invoice,
    lineItems,
    attachments,
    reminders,
    estimatePatch: { document_status: "invoiced", converted_invoice_id: input.invoiceId },
  };
}
