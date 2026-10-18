import { NextResponse } from "next/server";
import { addAttachment } from "@/lib/db/documents";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  const files: any[] = Array.isArray(b.files) ? b.files : [b];
  for (const f of files) {
    const r = addAttachment(id, {
      uploaded_by_role: "contractor",
      uploader_name: b.uploader_name || "Contractor",
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
