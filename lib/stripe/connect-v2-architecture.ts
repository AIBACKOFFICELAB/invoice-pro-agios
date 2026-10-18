/**
 * STRIPE ACCOUNTS V2 (MERCHANT CONFIG + DIRECT CHARGES) BLUEPRINT
 * Session 1 Policy: Simulated or Isolated Stripe Test Mode ONLY.
 * Live connected account onboarding and live charges are strictly disabled.
 */

export type InvoicePaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded";

export interface DirectChargeIntentRequest {
  invoiceId: string;
  organizationId: string;
  connectedMerchantAccountId: string; // e.g., "acct_test_v2_merchant_01" (Never a secret key!)
  amountCents: number;
  currency: string;
  platformApplicationFeeCents?: number;
}

/**
 * Validated Payment State Transitions driven by verified Webhook Events or Simulated Sandbox Triggers:
 * - payment_intent.created -> "pending"
 * - payment_intent.processing (e.g., ACH / bank debit) -> "processing"
 * - payment_intent.succeeded / checkout.session.completed -> "succeeded"
 * - payment_intent.payment_failed -> "failed"
 * - charge.refunded -> "refunded"
 */
export const ALLOWED_PAYMENT_STATE_TRANSITIONS: Record<
  InvoicePaymentStatus,
  InvoicePaymentStatus[]
> = {
  pending: ["processing", "succeeded", "failed"],
  processing: ["succeeded", "failed"],
  succeeded: ["refunded"],
  failed: ["pending", "processing", "succeeded"], // Retry allowed
  refunded: [], // Terminal state for full refund
};

export function canTransitionPaymentState(
  current: InvoicePaymentStatus,
  next: InvoicePaymentStatus
): boolean {
  return ALLOWED_PAYMENT_STATE_TRANSITIONS[current]?.includes(next) ?? false;
}

export interface PaymentStateMetadata {
  label: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
  webhookTrigger: string;
}

export const PAYMENT_STATUS_CONFIG: Record<InvoicePaymentStatus, PaymentStateMetadata> = {
  pending: {
    label: "Pending",
    description: "Invoice published; awaiting customer checkout or payment initiation.",
    badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    badgeText: "text-amber-500",
    iconName: "Clock",
    webhookTrigger: "payment_intent.created",
  },
  processing: {
    label: "Processing",
    description: "Payment initiated (e.g. ACH debit, bank wire clearing, or synchronous 3DS challenge).",
    badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    badgeText: "text-blue-500",
    iconName: "RefreshCw",
    webhookTrigger: "payment_intent.processing",
  },
  succeeded: {
    label: "Succeeded",
    description: "Funds captured and settled directly to contractor's Stripe v2 merchant balance.",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    badgeText: "text-emerald-500",
    iconName: "CheckCircle2",
    webhookTrigger: "payment_intent.succeeded",
  },
  failed: {
    label: "Failed",
    description: "Charge attempt declined (e.g. insufficient funds, expired card, blocked debit).",
    badgeBg: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
    badgeText: "text-rose-500",
    iconName: "AlertTriangle",
    webhookTrigger: "payment_intent.payment_failed",
  },
  refunded: {
    label: "Refunded",
    description: "Settled transaction returned in full back to original payment method.",
    badgeBg: "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400",
    badgeText: "text-slate-500",
    iconName: "RotateCcw",
    webhookTrigger: "charge.refunded",
  },
};
