import { NextResponse } from "next/server";
import { getInvoiceById } from "@/lib/db";
import { formatCents } from "@/lib/finance/calculator";
import { generateQrSvg } from "@/lib/qr/svg";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = getInvoiceById(id);
    if (!invoice) {
      return new Response("Invoice not found", { status: 404 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const proto = host.includes("localhost") ? "http" : "https";
    const portalPath = invoice.document_type === "estimate" ? `/e/${invoice.public_token}` : `/i/${invoice.public_token}`;
    const publicUrl = `${proto}://${host}${portalPath}`;

    const brandColor = invoice.org_brand_color || "#65C466";
    const logoUrl = invoice.org_logo_url;
    const logoFormat = invoice.org_logo_format || "framed";
    const qrSvg = generateQrSvg(publicUrl, 100);

    const isPaid = invoice.payment_status === "succeeded" || invoice.balance_due_cents === 0;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${invoice.document_type === "estimate" ? "Estimate" : "Invoice"} ${invoice.custom_code || invoice.invoice_number} — ${invoice.org_name || "Invoice Pro Agios"}</title>
  <style>
    @page { size: letter; margin: 16mm 18mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
      background: #FFFFFF;
      font-size: 13px;
    }
    .accent-bar {
      height: 4px;
      width: 100%;
      background-color: ${brandColor};
      margin: 20px 0 24px 0;
      border-radius: 2px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-left {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .logo-framed {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      object-fit: contain;
      padding: 4px;
      background: #FFFFFF;
    }
    .logo-full {
      max-height: 56px;
      max-width: 140px;
      object-fit: contain;
    }
    .monogram-badge {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
      color: #FFFFFF;
      background-color: ${brandColor};
    }
    .company-title {
      font-size: 20px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 4px 0;
      letter-spacing: -0.3px;
    }
    .company-meta {
      font-size: 11.5px;
      color: #64748B;
      line-height: 1.4;
    }
    .header-right {
      text-align: right;
    }
    .doc-type-label {
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #0F172A;
      margin: 0;
    }
    .doc-number {
      font-size: 16px;
      font-weight: 700;
      color: ${brandColor};
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      margin-top: 2px;
    }
    .doc-date-sub {
      font-size: 11.5px;
      color: #64748B;
      margin-top: 4px;
    }
    .project-hero {
      margin-bottom: 24px;
    }
    .project-name {
      font-size: 18px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 6px 0;
    }
    .project-message {
      font-size: 12.5px;
      color: #475569;
      margin: 0;
      line-height: 1.5;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 20px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 28px;
    }
    .meta-col-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #94A3B8;
      margin-bottom: 6px;
    }
    .meta-col-content {
      font-size: 12px;
      color: #1E293B;
      line-height: 1.45;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      border-bottom: 2px solid #CBD5E1;
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      background: #FFFFFF;
    }
    .items-table td {
      padding: 12px 12px;
      border-bottom: 1px solid #E2E8F0;
      font-size: 12.5px;
      vertical-align: top;
    }
    .item-title {
      font-weight: 700;
      color: #0F172A;
      font-size: 13px;
    }
    .item-note {
      font-style: italic;
      color: #64748B;
      font-size: 11.5px;
      margin-top: 3px;
      line-height: 1.4;
    }
    .bottom-layout {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 12px;
      gap: 32px;
    }
    .qr-container {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      background: #FFFFFF;
      max-width: 320px;
    }
    .qr-text-block {
      font-size: 11px;
      color: #64748B;
      line-height: 1.35;
    }
    .qr-text-block strong {
      color: #0F172A;
      display: block;
      margin-bottom: 2px;
    }
    .totals-box {
      width: 330px;
      border-collapse: collapse;
    }
    .totals-box td {
      padding: 5px 8px;
      font-size: 12.5px;
      border: none;
    }
    .totals-box tr.grand-row td {
      border-top: 2px solid #0F172A;
      font-weight: 900;
      font-size: 15px;
      color: #0F172A;
      padding-top: 8px;
    }
    .payment-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      background: #DCFCE7;
      color: #166534;
    }
    .footer-bar {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94A3B8;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="padding: 8px 18px; background: ${brandColor}; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
      Print / Save to PDF
    </button>
  </div>

  <div class="header">
    <div class="brand-left">
      ${logoUrl ? `
        <img src="${logoUrl}" alt="${invoice.org_name}" class="${logoFormat === 'full' ? 'logo-full' : 'logo-framed'}" />
      ` : `
        <div class="monogram-badge">
          ${(invoice.org_name || "IP").slice(0, 2).toUpperCase()}
        </div>
      `}
      <div>
        <h2 class="company-title">${invoice.org_name || "5 Star plumbing service"}</h2>
        <div class="company-meta">
          ${invoice.org_email || "5starplumbing05@gmail.com"} &bull; ${invoice.org_phone || "(786) 606-6944"}<br>
          ${invoice.org_address || "Miami, FL"}
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-type-label">${invoice.document_type === "estimate" ? "Estimate" : "Invoice"}</div>
      <div class="doc-number">${invoice.custom_code || invoice.invoice_number}</div>
      <div class="doc-date-sub">
        Date: <strong>${invoice.issue_date}</strong>
      </div>
    </div>
  </div>

  <!-- Full-width 4px Brand Accent Bar -->
  <div class="accent-bar"></div>

  ${invoice.project_title || invoice.client_message ? `
    <div class="project-hero">
      ${invoice.project_title ? `<div class="project-name">${invoice.project_title}</div>` : ""}
      <p class="project-message">${invoice.client_message || invoice.org_default_footer_message || "Thank you for your business. Please reach out if you have any questions."}</p>
    </div>
  ` : ""}

  <div class="meta-grid">
    <div>
      <div class="meta-col-title">Customer</div>
      <div class="meta-col-content">
        <strong>${invoice.customer_name || "Customer"}</strong><br>
        ${invoice.customer_company ? `${invoice.customer_company}<br>` : ""}
        ${invoice.service_address ? `${invoice.service_address}<br>` : ""}
        ${invoice.customer_phone ? `${invoice.customer_phone}<br>` : ""}
        ${invoice.customer_email || ""}
      </div>
    </div>
    <div>
      <div class="meta-col-title">${invoice.document_type === "estimate" ? "Estimate Details" : "Invoice Details"}</div>
      <div class="meta-col-content">
        ${invoice.custom_code ? `Custom ID: <strong>${invoice.custom_code}</strong><br>` : ""}
        Issue Date: <strong>${invoice.issue_date}</strong><br>
        Due Date: <strong>${invoice.due_date}</strong><br>
        Status: <span style="font-weight: 700; text-transform: uppercase;">${invoice.payment_status}</span>
      </div>
    </div>
    <div>
      <div class="meta-col-title">Payment</div>
      <div class="meta-col-content">
        ${isPaid ? `
          <span class="payment-badge">Paid in full</span><br>
          <span style="font-size: 11px; color: #64748B;">Date: ${invoice.issue_date}</span><br>
          <span style="font-size: 11px; color: #64748B;">Method: Mastercard 3221</span>
        ` : `
          Balance Due: <strong style="color: #DC2626;">${formatCents(invoice.balance_due_cents)}</strong><br>
          ${invoice.deposit_enabled ? `<span style="font-size: 11px; color: #64748B;">Deposit: ${formatCents(invoice.deposit_amount_cents)}</span>` : ""}
        `}
      </div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 55%;">Description</th>
        <th style="text-align: right; width: 12%;">Qty</th>
        <th style="text-align: right; width: 15%;">Unit Price</th>
        <th style="text-align: right; width: 18%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${(invoice.line_items || []).map((item: any) => `
        <tr>
          <td>
            <div class="item-title">${item.description}</div>
            ${item.note ? `<div class="item-note">${item.note}</div>` : ""}
          </td>
          <td style="text-align: right; font-weight: 600;">${item.quantity}</td>
          <td style="text-align: right;">${formatCents(item.unit_price_cents)}</td>
          <td style="text-align: right; font-weight: 700;">${formatCents(item.line_total_cents)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="bottom-layout">
    <div class="qr-container">
      <div style="flex-shrink: 0; line-height: 0;">
        ${qrSvg}
      </div>
      <div class="qr-text-block">
        <strong>Scan to View & Pay</strong>
        Open your phone's camera to review details, approve, and complete payment online.
      </div>
    </div>

    <table class="totals-box">
      <tr>
        <td style="color: #64748B;">Subtotal:</td>
        <td style="text-align: right; font-weight: 600;">${formatCents(invoice.subtotal_cents)}</td>
      </tr>
      ${invoice.discount_cents > 0 ? `
        <tr>
          <td style="color: #10B981;">Discount:</td>
          <td style="text-align: right; color: #10B981; font-weight: 600;">-${formatCents(invoice.discount_cents)}</td>
        </tr>
      ` : ""}
      ${invoice.tax_rate > 0 ? `
        <tr>
          <td style="color: #64748B;">Tax (${invoice.tax_rate}%):</td>
          <td style="text-align: right; font-weight: 600;">${formatCents(invoice.tax_amount_cents)}</td>
        </tr>
      ` : ""}
      ${invoice.late_fee_applied_cents > 0 ? `
        <tr>
          <td style="color: #DC2626;">Late Fee:</td>
          <td style="text-align: right; font-weight: 600; color: #DC2626;">${formatCents(invoice.late_fee_applied_cents)}</td>
        </tr>
      ` : ""}
      <tr class="grand-row">
        <td>Total:</td>
        <td style="text-align: right;">${formatCents(invoice.total_amount_cents)}</td>
      </tr>
      ${invoice.amount_paid_cents > 0 ? `
        <tr>
          <td style="color: #10B981; font-weight: 600;">Amount Paid:</td>
          <td style="text-align: right; font-weight: 700; color: #10B981;">-${formatCents(invoice.amount_paid_cents)}</td>
        </tr>
      ` : ""}
      <tr style="font-weight: 800; font-size: 14.5px; color: ${invoice.balance_due_cents > 0 ? '#DC2626' : '#10B981'};">
        <td>Balance Due:</td>
        <td style="text-align: right;">${formatCents(invoice.balance_due_cents)}</td>
      </tr>
    </table>
  </div>

  <div class="footer-bar">
    <div>${invoice.org_name || "Invoice Pro Agios"} &bull; Thank you for your business!</div>
    <div>Page 1 of 1</div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    return new Response("Internal Server Error: " + error.message, { status: 500 });
  }
}
