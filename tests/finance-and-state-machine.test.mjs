import test from "node:test";
import assert from "node:assert/strict";

import {
  computeLineTotalCents,
  computeInvoiceTotals,
  computeDepositSplit,
  computePaymentSchedule,
  computeLateFee,
  isOverdueBeyondGrace,
  planEstimateConversion,
  formatCents,
} from "../lib/math/calculator.ts";

import {
  ALLOWED_PAYMENT_STATE_TRANSITIONS,
  canTransitionPaymentState,
} from "../lib/stripe/connect-v2-architecture.ts";

// -----------------------------------------------------------------------------
// 1. Line Item Deterministic Cent Calculations
// -----------------------------------------------------------------------------
test("Deterministic Cent Math: line items calculate rounded integer cents", () => {
  // 120 units at $4.25 (425 cents) = 51000 cents ($510.00)
  assert.equal(computeLineTotalCents(120, 425), 51000);

  // Fractional hours e.g. 3.75 hours at $125.00 (12500 cents) = 46875 cents ($468.75)
  assert.equal(computeLineTotalCents(3.75, 12500), 46875);

  // Zero quantity or negative
  assert.equal(computeLineTotalCents(0, 5000), 0);
  assert.equal(computeLineTotalCents(-2, 5000), 0);
});

// -----------------------------------------------------------------------------
// 2. Subtotal, Tax, and Totals (Estimate #3060 Validation)
// -----------------------------------------------------------------------------
test("Deterministic Cent Math: Estimate #3060 exact totals", () => {
  // Bradford White $1,838.96 + Convenience Fee $125.00 + Labor $1,900.00 = $3,863.96
  const result = computeInvoiceTotals({
    lineItems: [
      { quantity: 1, unitPriceCents: 183896 },
      { quantity: 1, unitPriceCents: 12500 },
      { quantity: 1, unitPriceCents: 190000 },
    ],
    taxRatePercent: 0,
    discountCents: 0,
    amountPaidCents: 0,
  });

  assert.equal(result.subtotalCents, 386396);
  assert.equal(result.taxAmountCents, 0);
  assert.equal(result.totalAmountCents, 386396);
  assert.equal(result.balanceDueCents, 386396);
});

// -----------------------------------------------------------------------------
// 3. Flat and Percentage Deposit Splits
// -----------------------------------------------------------------------------
test("Deposit Schedules: flat and percentage deposit calculations", () => {
  const total = 386396; // $3,863.96

  // Flat deposit: $2,913.96 upfront, remaining balance $950.00
  const flatSplit = computeDepositSplit(total, "flat_cents", 291396);
  assert.equal(flatSplit.depositAmountCents, 291396);
  assert.equal(flatSplit.remainingBalanceCents, 95000);

  // Percentage deposit: 30% of $1,000.00 (100000 cents) = 30000 cents ($300.00)
  const pctSplit = computeDepositSplit(100000, "percentage", 30);
  assert.equal(pctSplit.depositAmountCents, 30000);
  assert.equal(pctSplit.remainingBalanceCents, 70000);

  // Percentage deposit with rounding: 33.33% of $100.00 (10000 cents) = 3333 cents
  const pctSplitRounding = computeDepositSplit(10000, "percentage", 33.33);
  assert.equal(pctSplitRounding.depositAmountCents, 3333);
  assert.equal(pctSplitRounding.remainingBalanceCents, 6667);
});

// -----------------------------------------------------------------------------
// 4. Payment Application to Deposit First
// -----------------------------------------------------------------------------
test("Deposit Schedules: payment waterfall applies to deposit first then balance", () => {
  const total = 386396; // $3,863.96
  const deposit = 291396; // $2,913.96

  // Scenario A: Unpaid
  const schedUnpaid = computePaymentSchedule({
    totalAmountCents: total,
    depositEnabled: true,
    depositAmountCents: deposit,
    amountPaidCents: 0,
  });
  assert.equal(schedUnpaid.depositOutstandingCents, 291396);
  assert.equal(schedUnpaid.balanceOutstandingCents, 95000);
  assert.equal(schedUnpaid.nextKind, "deposit");
  assert.equal(schedUnpaid.nextAmountCents, 291396);

  // Scenario B: Deposit Paid in Full
  const schedDepositPaid = computePaymentSchedule({
    totalAmountCents: total,
    depositEnabled: true,
    depositAmountCents: deposit,
    amountPaidCents: 291396,
  });
  assert.equal(schedDepositPaid.depositOutstandingCents, 0);
  assert.equal(schedDepositPaid.balanceOutstandingCents, 95000);
  assert.equal(schedDepositPaid.nextKind, "balance");
  assert.equal(schedDepositPaid.nextAmountCents, 95000);

  // Scenario C: Fully Paid
  const schedFullyPaid = computePaymentSchedule({
    totalAmountCents: total,
    depositEnabled: true,
    depositAmountCents: deposit,
    amountPaidCents: 386396,
  });
  assert.equal(schedFullyPaid.depositOutstandingCents, 0);
  assert.equal(schedFullyPaid.balanceOutstandingCents, 0);
  assert.equal(schedFullyPaid.nextKind, "none");
  assert.equal(schedFullyPaid.totalOutstandingCents, 0);
});

// -----------------------------------------------------------------------------
// 5. Late Fees Working Alongside Active Deposit Schedules
// -----------------------------------------------------------------------------
test("Late Fees: percentage and flat fees with grace period check", () => {
  // Grace period check: 3 days grace
  assert.equal(isOverdueBeyondGrace("2026-10-15", "2026-10-14", 3), false); // 1 day past due (within grace)
  assert.equal(isOverdueBeyondGrace("2026-10-18", "2026-10-14", 3), true);  // 4 days past due (beyond grace)

  // Percentage late fee: 5% on an overdue balance of $950.00 (95000 cents) = $47.50 (4750 cents)
  const pctFee = computeLateFee({
    type: "percentage",
    value: 5,
    overdueBaseCents: 95000,
  });
  assert.equal(pctFee, 4750);

  // Flat late fee: $50.00 flat (5000 cents)
  const flatFee = computeLateFee({
    type: "flat_cents",
    value: 5000,
    overdueBaseCents: 95000,
  });
  assert.equal(flatFee, 5000);

  // Total recalculated with late fee applied
  const totalWithLateFee = computeInvoiceTotals({
    lineItems: [{ quantity: 1, unitPriceCents: 386396 }],
    taxRatePercent: 0,
    discountCents: 0,
    amountPaidCents: 291396, // Deposit already paid
    lateFeeAppliedCents: 4750, // 5% on remaining $950.00
  });

  assert.equal(totalWithLateFee.totalAmountCents, 386396 + 4750); // $3,911.46
  assert.equal(totalWithLateFee.balanceDueCents, 95000 + 4750);   // $997.50
});

// -----------------------------------------------------------------------------
// 6. Estimate Approval & 1-Click Conversion Planning
// -----------------------------------------------------------------------------
test("Estimate Conversion: preserves line items, attachments, deposits and re-anchors reminders", () => {
  const mockEstimate = {
    id: "est_vanguard_3060",
    organization_id: "org_vanguard_03",
    customer_id: "cust_vanguard_c2",
    custom_code: "#3060",
    project_title: "3920 Garden Ave, Miami Beach, FL 33140",
    document_status: "approved",
    total_amount_cents: 386396,
    deposit_enabled: 1,
    deposit_type: "flat_cents",
    deposit_value: 291396,
    deposit_amount_cents: 291396,
    deposit_due_days: 0,
    balance_due_days: 1,
    late_fee_enabled: 1,
    late_fee_type: "percentage",
    late_fee_value: 5,
    late_fee_grace_days: 3,
    reminder_rules: JSON.stringify({
      enabled: true,
      estimate: ["sent_plus_2"],
      invoice: ["due_0", "due_3"],
    }),
  };

  const mockLineItems = [
    { id: "item_1", invoice_id: "est_vanguard_3060", description: "Water heater", quantity: 1, unit_price_cents: 183896 },
  ];

  const mockAttachments = [
    { id: "att_1", document_id: "est_vanguard_3060", file_name: "model-plate.png", mime_type: "image/png" },
  ];

  const plan = planEstimateConversion({
    estimate: mockEstimate,
    lineItems: mockLineItems,
    attachments: mockAttachments,
    today: "2026-10-17",
    invoiceId: "inv_converted_101",
    invoiceNumber: "INV-3060",
    publicToken: "tok_converted_3060",
    idGen: (p) => `${p}_gen_id`,
  });

  // Invoice preserves identity and financial properties
  assert.equal(plan.invoice.document_type, "invoice");
  assert.equal(plan.invoice.document_status, "sent");
  assert.equal(plan.invoice.converted_from_id, "est_vanguard_3060");
  assert.equal(plan.invoice.total_amount_cents, 386396);
  assert.equal(plan.invoice.deposit_amount_cents, 291396);
  assert.equal(plan.invoice.issue_date, "2026-10-17");
  assert.equal(plan.invoice.due_date, "2026-10-18"); // balance_due_days = 1

  // Preserves line items and attachments
  assert.equal(plan.lineItems.length, 1);
  assert.equal(plan.lineItems[0].invoice_id, "inv_converted_101");
  assert.equal(plan.attachments.length, 1);
  assert.equal(plan.attachments[0].document_id, "inv_converted_101");

  // Re-anchors invoice reminders based on rules
  assert.equal(plan.reminders.length > 0, true);

  // Estimate patch updates status to 'invoiced'
  assert.equal(plan.estimatePatch.document_status, "invoiced");
  assert.equal(plan.estimatePatch.converted_invoice_id, "inv_converted_101");
});

// -----------------------------------------------------------------------------
// 7. Stripe Connect v2 5-State Machine
// -----------------------------------------------------------------------------
test("Stripe Connect v2 5-State Machine: valid and illegal state transitions", () => {
  // Pending transitions
  assert.equal(canTransitionPaymentState("pending", "processing"), true);
  assert.equal(canTransitionPaymentState("pending", "succeeded"), true);
  assert.equal(canTransitionPaymentState("pending", "failed"), true);

  // Processing transitions
  assert.equal(canTransitionPaymentState("processing", "succeeded"), true);
  assert.equal(canTransitionPaymentState("processing", "failed"), true);

  // Succeeded transitions
  assert.equal(canTransitionPaymentState("succeeded", "refunded"), true);

  // Failed transitions
  assert.equal(canTransitionPaymentState("failed", "pending"), true);
  assert.equal(canTransitionPaymentState("failed", "succeeded"), true);

  // Terminal checks
  assert.equal(canTransitionPaymentState("refunded", "pending"), false);
  assert.equal(canTransitionPaymentState("refunded", "succeeded"), false);
  assert.equal(canTransitionPaymentState("succeeded", "pending"), false);
});

// -----------------------------------------------------------------------------
// 8. Session 2.5: Seeded Invoice #5033 & Estimate #3060 Integrity
// -----------------------------------------------------------------------------
test("Session 2.5 Data Seeding: Invoice #5033 and Estimate #3060 deterministic integrity", async () => {
  const { getInvoiceById, getOrganizationById, getCustomersByOrg } = await import("../lib/db/index.ts");

  // Verify 5 Star plumbing service
  const org = getOrganizationById("org_5star_01");
  assert.ok(org, "org_5star_01 must exist");
  assert.equal(org.name, "5 Star plumbing service");
  assert.equal(org.brand_primary_color, "#65C466");
  assert.equal(org.logo_format, "framed");

  // Verify Invoice #5033
  const inv5033 = getInvoiceById("inv_5star_5033");
  assert.ok(inv5033, "Invoice #5033 must exist");
  assert.equal(inv5033.custom_code, "#5033");
  assert.equal(inv5033.total_amount_cents, 16000);
  assert.equal(inv5033.amount_paid_cents, 16000);
  assert.equal(inv5033.balance_due_cents, 0);
  assert.equal(inv5033.payment_status, "succeeded");
  assert.equal(inv5033.customer_name, "Tatiana Ruiz");
  assert.ok(inv5033.line_items.some(li => li.description === "Master bedroom showerdrain unclogged" && li.note?.includes("Ran 25 ft of snake")));

  // Verify Estimate #3060
  const est3060 = getInvoiceById("est_vanguard_3060");
  assert.ok(est3060, "Estimate #3060 must exist");
  assert.equal(est3060.document_type, "estimate");
  assert.equal(est3060.custom_code, "#3060");
  assert.equal(est3060.total_amount_cents, 386396);
  assert.equal(est3060.deposit_amount_cents, 291396);
  assert.equal(est3060.balance_due_cents, 386396); // zero payments made yet

  // Verify Customers
  const customers = getCustomersByOrg("org_5star_01");
  const tatiana = customers.find(c => c.name === "Tatiana Ruiz");
  assert.ok(tatiana, "Tatiana Ruiz must be seeded under org_5star_01");
  assert.equal(tatiana.phone, "(404) 952-3973");
});

// -----------------------------------------------------------------------------
// 9. Session 2.5: Subscriber Business Branding Persistence
// -----------------------------------------------------------------------------
test("Session 2.5 Business Branding: updates logo, format, color, and default footer message", async () => {
  const { updateOrganizationBranding, getOrganizationById } = await import("../lib/db/index.ts");

  const testOrgId = "org_nova_02";
  const ok = updateOrganizationBranding(testOrgId, {
    brand_primary_color: "#7C3AED",
    logo_format: "full",
    logo_url: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    default_footer_message: "Custom footer for creative projects.",
  });
  assert.equal(ok, true);

  const persisted = getOrganizationById(testOrgId);
  assert.equal(persisted?.brand_primary_color, "#7C3AED");
  assert.equal(persisted?.logo_format, "full");
  assert.equal(persisted?.default_footer_message, "Custom footer for creative projects.");
});

// -----------------------------------------------------------------------------
// 10. Session 2.5: Inline Customer Creation
// -----------------------------------------------------------------------------
test("Session 2.5 Customer Creation: persists new customer and links to organization", async () => {
  const { createCustomer, getCustomersByOrg } = await import("../lib/db/index.ts");

  const newCust = createCustomer({
    organization_id: "org_5star_01",
    name: "Dr. Evelyn Reed",
    company_name: "Reed Bio Labs",
    email: "evelyn@reedbiolabs.com",
    phone: "(305) 555-7890",
    service_address: "1200 Brickell Ave, Miami, FL 33131",
  });

  assert.ok(newCust.id.startsWith("cust_"));
  assert.equal(newCust.name, "Dr. Evelyn Reed");
  assert.equal(newCust.company_name, "Reed Bio Labs");

  const orgCustomers = getCustomersByOrg("org_5star_01");
  const found = orgCustomers.find(c => c.id === newCust.id);
  assert.ok(found, "Newly created customer must be queryable via getCustomersByOrg");
  assert.equal(found.service_address, "1200 Brickell Ave, Miami, FL 33131");
});

