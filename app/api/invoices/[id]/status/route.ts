import { NextResponse } from "next/server";
import { setDocumentStatus } from "@/lib/db/documents";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (!["sent", "approved", "declined", "draft"].includes(status)) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
  }
  const r = setDocumentStatus(id, status);
  return NextResponse.json({ success: r.ok, error: r.error, invoice: r.invoice, converted: r.converted }, { status: r.ok ? 200 : 400 });
}
