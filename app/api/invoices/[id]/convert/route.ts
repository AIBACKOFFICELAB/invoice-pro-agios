import { NextResponse } from "next/server";
import { convertEstimateToInvoice } from "@/lib/db/documents";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = convertEstimateToInvoice(id);
  return NextResponse.json({ success: r.ok, error: r.error, invoice: r.converted, estimate: r.invoice }, { status: r.ok ? 200 : 400 });
}
