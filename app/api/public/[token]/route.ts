import { NextResponse } from "next/server";
import { getInvoiceByToken } from "@/lib/db";
import { markViewed, approveEstimate, declineEstimate, recordPayment } from "@/lib/db/documents";

function publicView(doc: any) {
  const { events, reminders, ...rest } = doc;
  let converted_invoice_token: string | null = null;
  if (doc.converted_invoice_id) {
    // resolved lazily by caller through getInvoiceByToken-free lookup
    converted_invoice_token = doc.__converted_token || null;
  }
  return { ...rest, converted_invoice_token };
}

async function withConverted(doc: any) {
  if (doc?.converted_invoice_id) {
    const { getInvoiceById } = await import("@/lib/db");
    doc.__converted_token = getInvoiceById(doc.converted_invoice_id)?.public_token || null;
  }
  return publicView(doc);
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doc = markViewed(token);
  if (!doc) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, document: await withConverted(doc) });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doc = getInvoiceByToken(token);
  if (!doc) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const { action } = await req.json();

  let r;
  switch (action) {
    case "approve": r = approveEstimate(doc.id, "customer"); break;
    case "decline": r = declineEstimate(doc.id); break;
    case "pay_deposit": r = recordPayment(doc.id, "deposit"); break;
    case "pay_balance": r = recordPayment(doc.id, "balance"); break;
    case "pay_full": r = recordPayment(doc.id, "full"); break;
    default: return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  }
  if (!r.ok) return NextResponse.json({ success: false, error: r.error }, { status: 400 });
  const fresh = getInvoiceByToken(token)!;
  return NextResponse.json({
    success: true,
    document: await withConverted(fresh),
    converted_invoice_token: r.converted?.public_token || null,
  });
}
