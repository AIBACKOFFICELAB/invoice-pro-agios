import { NextResponse } from "next/server";
import { AIInvoiceExtractionSchema, AIInvoiceExtraction } from "@/lib/validators/ai-extraction";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `
You are the Voice-to-Invoice extraction engine for Invoice Pro Agios.
Extract structured invoice fields from spoken contractor instructions.

STRICT ZERO-HALLUCINATION RULES:
1. NEVER invent, guess, or fabricate missing prices, quantities, tax rates, customer names, emails, or payment terms.
2. If a contractor mentions a service item without stating a price, set "unitPriceCents": null and add an entry to "missingFieldsWarnings".
3. If a quantity is not stated, set "quantity": null (do not silently assume 1 unless the phrasing explicitly says "one" or "a single").
4. If tax rate is not mentioned, set "taxRatePercent": null.
5. Convert explicitly stated dollar amounts to integer cents (e.g., "$285.50" -> 28550).
6. Return ONLY valid JSON matching the exact schema.
`;

// Deterministic simulation parser for local preview mode when GEMINI_API_KEY is not configured
function simulatedVoiceExtraction(transcript: string): AIInvoiceExtraction {
  const warnings: string[] = [];
  const lower = transcript.toLowerCase();

  // Extract customer name if mentioned
  let customerName: string | null = null;
  const custMatch = transcript.match(/(?:for|client|customer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (custMatch) {
    customerName = custMatch[1];
  } else {
    warnings.push("Customer name was not explicitly stated in spoken instructions.");
  }

  // Extract due days
  let dueInDays: number | null = null;
  const dueMatch = lower.match(/due\s+(?:in\s+)?(\d+)\s+days/);
  if (dueMatch) {
    dueInDays = parseInt(dueMatch[1], 10);
  } else {
    warnings.push("Payment due date/terms were not specified (defaulting to null).");
  }

  // Extract line items
  const lineItems: AIInvoiceExtraction["lineItems"] = [];

  // Look for items with prices
  const itemMatches = transcript.matchAll(/([A-Za-z0-9\s\-\(\)\/]{4,50}?)(?:\s*(?:at|for|\:)\s*\$(\d+(?:\.\d{2})?)|(?:\s*\(?no price stated\)?))/gi);
  for (const m of itemMatches) {
    const desc = m[1].replace(/^(and|also|plus|item|line item)\s+/i, "").trim();
    const priceStr = m[2];
    if (priceStr) {
      const cents = Math.round(parseFloat(priceStr) * 100);
      lineItems.push({
        description: desc,
        category: "service",
        quantity: 1,
        unitPriceCents: cents,
        confidenceNote: "Spoken price parsed deterministically",
      });
    } else {
      lineItems.push({
        description: desc,
        category: "service",
        quantity: null,
        unitPriceCents: null,
        confidenceNote: "Missing price in spoken audio",
      });
      warnings.push(`Item "${desc}" is missing unit price and quantity.`);
    }
  }

  if (lineItems.length === 0) {
    // If no regex match, generate from transcript tokens safely without hallucinating
    lineItems.push({
      description: transcript.slice(0, 60),
      category: "service",
      quantity: null,
      unitPriceCents: null,
      confidenceNote: "Spoken task captured; price not detected",
    });
    warnings.push("No explicit dollar amounts were detected in the voice transcript.");
  }

  return {
    customerName,
    customerCompany: null,
    customerEmail: null,
    customerPhone: null,
    serviceAddress: null,
    invoiceNumberSuggestion: `INV-2026-${Math.floor(Math.random() * 900 + 100)}`,
    issueDateISO: new Date().toISOString().split("T")[0],
    dueInDays,
    taxRatePercent: null, // Zero-hallucination: null unless explicitly stated
    discountCents: null,
    lineItems,
    notes: `Voice instruction: "${transcript.slice(0, 150)}..."`,
    missingFieldsWarnings: warnings,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transcript = (body.transcript || body.rawText || "").trim();

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: "Spoken instruction transcript is required." },
        { status: 400 }
      );
    }

    // Live Gemini API call if key configured
    if (GEMINI_API_KEY && GEMINI_API_KEY !== "your-gemini-api-key-server-only") {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [
            {
              role: "user",
              parts: [{ text: `Spoken contractor transcript:\n"""${transcript}"""` }],
            },
          ],
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
        console.warn("Gemini API call failed, falling back to simulated parser:", await response.text());
      }
    }

    // Local Preview deterministic simulation fallback
    const parsed = simulatedVoiceExtraction(transcript);

    return NextResponse.json({
      success: true,
      modelUsed: `${GEMINI_MODEL} (Simulated Preview Engine)`,
      requiresHumanConfirmation: true,
      data: parsed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Voice-to-Invoice extraction failed." },
      { status: 500 }
    );
  }
}
