import { NextResponse } from "next/server";
import { transitionInvoicePaymentStatus } from "@/lib/db";
import { InvoicePaymentStatus } from "@/lib/stripe/connect-v2-architecture";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nextStatus, note } = body;

    if (!nextStatus) {
      return NextResponse.json({ success: false, error: "nextStatus is required" }, { status: 400 });
    }

    const result = transitionInvoicePaymentStatus(id, nextStatus as InvoicePaymentStatus, note);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({ success: true, invoice: result.invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
