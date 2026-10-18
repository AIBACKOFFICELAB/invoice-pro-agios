import { NextResponse } from "next/server";
import { getInvoicesByOrg, getDashboardKPIs } from "@/lib/db";
import { createDocument } from "@/lib/db/documents";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || "org_apex_01";
    const statusFilter = searchParams.get("status") || "all";
    const type = searchParams.get("type") === "estimate" ? "estimate" : "invoice";

    const invoices = getInvoicesByOrg(orgId, statusFilter, type);
    const kpis = getDashboardKPIs(orgId);

    return NextResponse.json({ success: true, invoices, kpis });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.organization_id || !body.customer_id || !body.line_items || body.line_items.length === 0) {
      return NextResponse.json(
        { success: false, error: "organization_id, customer_id, and at least 1 line item are required." },
        { status: 400 }
      );
    }
    const invoice = createDocument({
      ...body,
      document_type: body.document_type === "estimate" ? "estimate" : "invoice",
    });
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
