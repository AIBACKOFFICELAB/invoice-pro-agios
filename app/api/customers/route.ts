import { NextResponse } from "next/server";
import { getCustomersByOrg, createCustomer } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || "org_apex_01";
    const customers = getCustomersByOrg(orgId);
    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.organization_id || !body.name) {
      return NextResponse.json({ success: false, error: "organization_id and name are required." }, { status: 400 });
    }
    const customer = createCustomer(body);
    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
