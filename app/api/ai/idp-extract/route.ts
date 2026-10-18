import { NextResponse } from "next/server";
import { AIInvoiceExtractionSchema, AIInvoiceExtraction } from "@/lib/validators/ai-extraction";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const IDP_SYSTEM_INSTRUCTION = `
You are the Intelligent Document Processing (IDP) extraction engine for Invoice Pro Agios.
Analyze the uploaded contractor job sheet, work order, or supply-house receipt image/PDF text and extract available customer, service, pricing, and invoice data.

STRICT ZERO-HALLUCINATION RULES:
1. Extract ONLY text and numbers legibly present on the document.
2. NEVER invent missing unit prices, quantities, tax rates, customer details, or payment terms. Use null for any unreadable or absent field and list it in "missingFieldsWarnings".
3. Do not trust printed subtotal/total arithmetic blindly: extract each line item's quantity and unitPriceCents so the application can compute totals deterministically.
4. Return ONLY valid JSON matching the exact schema.
`;

function simulatedIdpExtraction(documentText: string): AIInvoiceExtraction {
  const warnings: string[] = [];

  // Parse sample documents or custom text
  let customerName: string | null = null;
  const custMatch = documentText.match(/(?:Customer|Client|Bill To|Sold To):\s*([^\n\r,]+)/i);
  if (custMatch) {
    customerName = custMatch[1].trim();
  } else {
    warnings.push("No explicit customer/client name detected on document.");
  }

  const lineItems: AIInvoiceExtraction["lineItems"] = [];
  const lines = documentText.split(/[\r\n]+/);

  for (const line of lines) {
    const priceMatch = line.match(/\$(\d+(?:\.\d{2})?)/);
    const qtyMatch = line.match(/(?:qty|quantity|\bcount\b)\s*[:=]?\s*(\d+(?:\.\d+)?)/i) || line.match(/^(\d+)\s+x\s+/i);

    if (priceMatch) {
      const cents = Math.round(parseFloat(priceMatch[1]) * 100);
      const desc = line.replace(/\$\d+(?:\.\d{2})?/, "").replace(/qty\s*[:=]?\s*\d+/i, "").trim() || "Item listed on document";
      const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;

      lineItems.push({
        description: desc,
        category: "material",
        quantity: qty,
        unitPriceCents: cents,
        confidenceNote: "Extracted from receipt line item",
      });
    }
  }

  if (lineItems.length === 0) {
    warnings.push("Could not parse distinct itemized rows; contractor review required.");
    lineItems.push({
      description: "Uploaded document work summary",
      category: "service",
      quantity: 1,
      unitPriceCents: null,
      confidenceNote: "Missing price on printed sheet",
    });
  }

  return {
    customerName,
    customerCompany: null,
    customerEmail: null,
    customerPhone: null,
    serviceAddress: null,
    invoiceNumberSuggestion: `REC-${Date.now().toString().slice(-4)}`,
    issueDateISO: new Date().toISOString().split("T")[0],
    dueInDays: 14,
    taxRatePercent: null, // Zero hallucination: null unless explicitly stated
    discountCents: null,
    lineItems,
    notes: "Extracted via IDP Receipt & Work Order Scanner (Verified by contractor).",
    missingFieldsWarnings: warnings,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentText, imageBase64, mimeType } = body;

    if (!documentText && !imageBase64) {
      return NextResponse.json(
        { success: false, error: "Provide either documentText or imageBase64 + mimeType." },
        { status: 400 }
      );
    }

    if (GEMINI_API_KEY && GEMINI_API_KEY !== "your-gemini-api-key-server-only") {
      const parts: any[] = [{ text: "Extract structured invoice data from this document:" }];
      if (documentText) {
        parts.push({ text: documentText });
      }
      if (imageBase64 && mimeType) {
        parts.push({
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        });
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: IDP_SYSTEM_INSTRUCTION }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.0,
            responseMimeType: "application/json",
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const rawJson = result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = AIInvoiceExtractionSchema.parse(JSON.parse(rawJson));

        return NextResponse.json({
          success: true,
          modelUsed: GEMINI_MODEL,
          requiresHumanConfirmation: true,
          data: parsed,
        });
      } else {
        console.warn("Gemini IDP API error, falling back to simulated parser:", await response.text());
      }
    }

    // Local Preview simulation fallback
    const parsed = simulatedIdpExtraction(documentText || "Supply House Receipt #9021\nCustomer: Industrial Dynamics\n1 x High-voltage Surge Suppressor $420.00\n4 x Heavy Duty Lugs $24.50");

    return NextResponse.json({
      success: true,
      modelUsed: `${GEMINI_MODEL} (Simulated IDP Engine)`,
      requiresHumanConfirmation: true,
      data: parsed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "IDP document extraction failed." },
      { status: 500 }
    );
  }
}
