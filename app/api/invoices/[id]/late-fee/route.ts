import { NextResponse } from "next/server";
import { applyLateFee } from "@/lib/db/documents";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const r = applyLateFee(id, { simulate: !!body.simulate });
  return NextResponse.json({ success: r.ok, error: r.error, feeCents: r.feeCents, invoice: r.invoice }, { status: r.ok ? 200 : 400 });
}
