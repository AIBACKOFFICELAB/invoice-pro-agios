import { z } from "zod";

export const ExtractedLineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.enum(["service", "material", "labor", "equipment"]).nullable(),
  quantity: z.number().positive().nullable(), // NULL if not explicitly spoken/printed
  unitPriceCents: z.number().int().nonnegative().nullable(), // NULL if price not stated
  confidenceNote: z.string().nullable(),
});

export const AIInvoiceExtractionSchema = z.object({
  customerName: z.string().nullable(),
  customerCompany: z.string().nullable(),
  customerEmail: z.string().email().nullable().or(z.literal(null)),
  customerPhone: z.string().nullable(),
  serviceAddress: z.string().nullable(),
  invoiceNumberSuggestion: z.string().nullable(),
  issueDateISO: z.string().nullable(),
  dueInDays: z.number().int().nonnegative().nullable(),
  taxRatePercent: z.number().nonnegative().nullable(), // NULL unless explicitly stated
  discountCents: z.number().int().nonnegative().nullable(),
  lineItems: z.array(ExtractedLineItemSchema),
  notes: z.string().nullable(),
  missingFieldsWarnings: z.array(z.string()),
});

export type ExtractedLineItem = z.infer<typeof ExtractedLineItemSchema>;
export type AIInvoiceExtraction = z.infer<typeof AIInvoiceExtractionSchema>;
