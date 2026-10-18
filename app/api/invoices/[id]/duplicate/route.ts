import { NextResponse } from "next/server";
import { getInvoiceById } from "@/lib/db";
import { createDocument } from "@/lib/db/documents";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = getInvoiceById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Source invoice not found" }, { status: 404 });
    }

    const today = new Date().toISOString().split("T")[0];
    const newInvoice = createDocument({
      organization_id: existing.organization_id,
      customer_id: existing.customer_id,
      document_type: existing.document_type || "invoice",
      document_status: "draft",
      project_title: existing.project_title ? `${existing.project_title} (Copy)` : "Project Copy",
      custom_code: null,
      cc_emails: existing.cc_emails || [],
      client_message: existing.client_message || "",
      issue_date: today,
      tax_rate: existing.tax_rate,
      discount_cents: existing.discount_cents,
      notes: existing.notes || "",
      creation_source: "manual",
      deposit_enabled: !!existing.deposit_enabled,
      deposit_type: existing.deposit_type || "percentage",
      deposit_value: existing.deposit_value || 0,
      deposit_due_days: existing.deposit_due_days || 0,
      balance_due_days: existing.balance_due_days || 14,
      late_fee_enabled: !!existing.late_fee_enabled,
      late_fee_type: existing.late_fee_type || "percentage",
      late_fee_value: existing.late_fee_value || 0,
      late_fee_grace_days: existing.late_fee_grace_days || 3,
      reminder_rules: existing.reminder_rules,
      line_items: (existing.line_items || []).map((li: any) => ({
        category: li.category,
        description: li.description,
        quantity: li.quantity,
        unit_price_cents: li.unit_price_cents,
        note: li.note,
      })),
    });

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
