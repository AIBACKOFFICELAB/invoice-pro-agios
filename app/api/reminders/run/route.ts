import { NextResponse } from "next/server";
import { runReminders } from "@/lib/db/documents";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = runReminders({ orgId: body.orgId, force: body.force !== false });
  return NextResponse.json({ success: true, result });
}
