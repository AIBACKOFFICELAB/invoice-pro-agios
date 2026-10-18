import { NextResponse } from "next/server";
import { updateOrganizationBranding } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Organization ID is required." }, { status: 400 });
    }
    updateOrganizationBranding(id, updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return PATCH(req);
}
