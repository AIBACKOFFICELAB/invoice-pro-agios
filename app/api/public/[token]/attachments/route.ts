import { NextResponse } from "next/server";
import { getInvoiceByToken } from "@/lib/db";
import { addAttachment } from "@/lib/db/documents";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doc = getInvoiceByToken(token);
  if (!doc) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const b = await req.json();
  const files: any[] = Array.isArray(b.files) ? b.files : [b];
  for (const f of files) {
    const r = addAttachment(doc.id, {
      uploaded_by_role: "client",
      uploader_name: doc.customer_name || "Client",
      file_name: String(f.file_name || "upload"),
      mime_type: String(f.mime_type || ""),
      file_size_bytes: Number(f.file_size_bytes) || 0,
      data_url_or_path: String(f.data_url_or_path || ""),
      caption: f.caption || null,
    });
    if (!r.ok) return NextResponse.json({ success: false, error: r.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
