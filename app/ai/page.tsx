"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mic,
  FileUp,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Code2,
  Terminal,
} from "lucide-react";
import { formatCents } from "@/lib/finance/calculator";
import { AIInvoiceExtraction } from "@/lib/validators/ai-extraction";

export default function AIHubPage() {
  const [activeTab, setActiveTab] = useState<"voice" | "idp">("voice");

  // Voice State
  const voiceSamples = [
    `Invoice for Evelyn Wright at Wright Commercial Real Estate. We installed a 200A 3-Phase Main Distribution Panel Upgrade for $3,200.00, Square D 200A Breaker Kit for $1,150.00, and city inspection fee at $350.00. Payment terms are due in 14 days.`,
    `Invoice for Travis Miller at Miller Craft Brewery. Installed dedicated 50A circuit run for canning line at $1,850.00, plus 120 feet of heavy conduit wire at $4.25 per foot, and washdown disconnect switch for $480.00. Tax rate is 8.25%.`,
    `Emergency service call for client Elena Ross. Checked electrical subpanel. (Note: pricing not stated).`,
  ];
  const [voiceText, setVoiceText] = useState(voiceSamples[0]);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState<AIInvoiceExtraction | null>(null);
  const [voiceModel, setVoiceModel] = useState<string | null>(null);

  // IDP State
  const idpSamples = [
    `SUPPLY HOUSE RECEIPT #8819\nCustomer: Evelyn Wright\nSquare D 200A Enclosure Kit qty: 1 $1150.00\nAustin City Electrical Permit $350.00`,
    `JOB WORK ORDER #4402\nClient: Travis Miller\nDedicated 50A Circuit Installation $1850.00\nConduit & THHN Copper Wire qty: 120 $4.25`,
  ];
  const [idpText, setIdpText] = useState(idpSamples[0]);
  const [idpLoading, setIdpLoading] = useState(false);
  const [idpResult, setIdpResult] = useState<AIInvoiceExtraction | null>(null);
  const [idpModel, setIdpModel] = useState<string | null>(null);

  const handleRunVoice = async () => {
    setVoiceLoading(true);
    setVoiceResult(null);
    try {
      const res = await fetch("/api/ai/voice-to-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: voiceText }),
      });
      const data = await res.json();
      if (data.success) {
        setVoiceResult(data.data);
        setVoiceModel(data.modelUsed);
      }
    } catch (e: any) {
      alert("Extraction failed: " + e.message);
    } finally {
      setVoiceLoading(false);
    }
  };

  const handleRunIdp = async () => {
    setIdpLoading(true);
    setIdpResult(null);
    try {
      const res = await fetch("/api/ai/idp-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: idpText }),
      });
      const data = await res.json();
      if (data.success) {
        setIdpResult(data.data);
        setIdpModel(data.modelUsed);
      }
    } catch (e: any) {
      alert("IDP failed: " + e.message);
    } finally {
      setIdpLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-field-border">
        <div className="flex items-center gap-2 text-xs font-mono text-agios-blue font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 3.8 Flash AI Laboratory</span>
        </div>
        <h1 className="text-2xl font-black text-field-text tracking-tight">
          Voice & Intelligent Document Processing Studio
        </h1>
        <p className="text-xs text-field-muted mt-1">
          Interactive zero-hallucination verification suite. Enforces strict schema contracts: unstated fields return <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">null</code> and require explicit human confirmation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-field-border pb-2">
        <button
          onClick={() => setActiveTab("voice")}
          className={`touch-target px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
            activeTab === "voice"
              ? "bg-agios-blue text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Voice-to-Invoice (POST /api/ai/voice-to-invoice)</span>
        </button>

        <button
          onClick={() => setActiveTab("idp")}
          className={`touch-target px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
            activeTab === "idp"
              ? "bg-cyan-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>Document & Receipt IDP (POST /api/ai/idp-extract)</span>
        </button>
      </div>

      {/* TAB 1: VOICE TO INVOICE */}
      {activeTab === "voice" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                Contractor Voice Instruction
              </h2>
              <span className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                gemini-3.8-flash
              </span>
            </div>

            <textarea
              rows={6}
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              className="w-full p-3 rounded-lg border border-field-border text-xs font-mono bg-field-canvas focus:ring-2 focus:ring-agios-blue/20"
              placeholder="Enter spoken contractor instructions..."
            />

            <div className="space-y-1.5 text-xs">
              <span className="text-slate-400 block text-[11px] uppercase font-mono">Test Sample Transcripts:</span>
              <div className="flex flex-wrap gap-1.5">
                {voiceSamples.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setVoiceText(s)}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono"
                  >
                    Sample #{i + 1} {i === 2 ? "(Missing Price Test)" : ""}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={voiceLoading}
              onClick={handleRunVoice}
              className="touch-target w-full py-2.5 rounded-lg bg-agios-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{voiceLoading ? "Running Extraction..." : "Extract Structured Fields"}</span>
            </button>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center justify-between">
              <span>Extraction & Guardrail Audit</span>
              {voiceModel && <span className="text-xs text-slate-500 font-normal">{voiceModel}</span>}
            </h2>

            {!voiceResult && !voiceLoading && (
              <div className="py-16 text-center text-xs text-slate-400 font-mono">
                Click "Extract Structured Fields" to test the zero-hallucination engine.
              </div>
            )}

            {voiceLoading && (
              <div className="py-16 text-center text-xs text-slate-500 font-mono animate-pulse">
                Parsing spoken transcript & validating against Zod schema...
              </div>
            )}

            {voiceResult && (
              <div className="space-y-4">
                {/* Missing Fields Warnings */}
                {voiceResult.missingFieldsWarnings.length > 0 ? (
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Zero-Hallucination Warnings Detected:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 font-mono">
                      {voiceResult.missingFieldsWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>All required fields explicitly detected; zero fabricated values.</span>
                  </div>
                )}

                {/* Structured Fields */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Customer: <strong className="text-slate-900">{voiceResult.customerName || "null"}</strong></div>
                    <div>Due In Days: <strong className="text-slate-900">{voiceResult.dueInDays || "null"}</strong></div>
                    <div>Tax Rate: <strong className="text-slate-900">{voiceResult.taxRatePercent !== null ? `${voiceResult.taxRatePercent}%` : "null"}</strong></div>
                    <div>Line Items: <strong className="text-slate-900">{voiceResult.lineItems.length}</strong></div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-500 uppercase">Itemized Rows:</div>
                  {voiceResult.lineItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded border border-slate-200 bg-white text-xs font-mono flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{item.description}</div>
                        <div className="text-[10px] text-slate-500">
                          Qty: {item.quantity !== null ? item.quantity : "null"} &bull; {item.confidenceNote}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        {item.unitPriceCents !== null ? formatCents(item.unitPriceCents) : <span className="text-rose-600">null</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/invoices/new"
                  className="touch-target w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Open in Invoice Builder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IDP DOCUMENT SCANNER */}
      {activeTab === "idp" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                Document / Supply Receipt Text
              </h2>
              <span className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                gemini-3.8-flash (multimodal)
              </span>
            </div>

            <textarea
              rows={6}
              value={idpText}
              onChange={(e) => setIdpText(e.target.value)}
              className="w-full p-3 rounded-lg border border-field-border text-xs font-mono bg-field-canvas focus:ring-2 focus:ring-agios-blue/20"
              placeholder="Paste printed work order or receipt text..."
            />

            <div className="space-y-1.5 text-xs">
              <span className="text-slate-400 block text-[11px] uppercase font-mono">Sample Receipts:</span>
              <div className="flex flex-wrap gap-1.5">
                {idpSamples.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setIdpText(s)}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono"
                  >
                    Receipt #{i + 1}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={idpLoading}
              onClick={handleRunIdp}
              className="touch-target w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{idpLoading ? "Parsing Document..." : "Parse Document via IDP"}</span>
            </button>
          </div>

          {/* IDP Results */}
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center justify-between">
              <span>IDP Extraction Preview</span>
              {idpModel && <span className="text-xs text-slate-500 font-normal">{idpModel}</span>}
            </h2>

            {!idpResult && !idpLoading && (
              <div className="py-16 text-center text-xs text-slate-400 font-mono">
                Click "Parse Document via IDP" to run extraction.
              </div>
            )}

            {idpLoading && (
              <div className="py-16 text-center text-xs text-slate-500 font-mono animate-pulse">
                Analyzing receipt document & enforcing zero-hallucination bounds...
              </div>
            )}

            {idpResult && (
              <div className="space-y-4">
                {idpResult.missingFieldsWarnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1 font-mono">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Missing Fields Warnings:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px]">
                      {idpResult.missingFieldsWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-500 uppercase">Extracted Materials / Parts:</div>
                  {idpResult.lineItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded border border-slate-200 bg-white text-xs font-mono flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{item.description}</div>
                        <div className="text-[10px] text-slate-500">Qty: {item.quantity} &bull; {item.category}</div>
                      </div>
                      <div className="font-bold text-slate-900">
                        {item.unitPriceCents !== null ? formatCents(item.unitPriceCents) : "null"}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/invoices/new"
                  className="touch-target w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Stage Into Active Invoice Builder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
