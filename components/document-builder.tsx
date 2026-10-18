"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Mic,
  FileUp,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  Calculator,
  ShieldCheck,
  Sparkles,
  Paperclip,
  Percent,
  Calendar,
  Clock,
  Send,
  FileText,
  User,
  Search,
  X,
  UserPlus,
} from "lucide-react";
import {
  computeInvoiceTotals,
  computeLineTotalCents,
  computeDepositSplit,
  formatCents,
  parseDollarsToCents,
  addDays,
  dueDaysLabel,
  DocumentType,
  DepositType,
  LateFeeType,
  ReminderRules,
  DEFAULT_REMINDER_RULES,
} from "@/lib/math/calculator";
import { AIInvoiceExtraction } from "@/lib/validators/ai-extraction";
import { Drawer, Toggle, Segmented } from "@/components/ui/drawer";
import { FileDrop, StagedFile } from "@/components/attachments";

interface LineItemState {
  id: string;
  category: "service" | "material" | "labor" | "equipment";
  description: string;
  quantity: number;
  unitPriceDollars: string;
  note?: string;
}

interface CustomerOption {
  id: string;
  name: string;
  company_name: string | null;
  email?: string | null;
  phone?: string | null;
  service_address?: string | null;
}

export function DocumentBuilder({ initialType = "invoice" }: { initialType?: DocumentType }) {
  const router = useRouter();
  const [docType, setDocType] = useState<DocumentType>(initialType);
  const [orgId, setOrgId] = useState("org_apex_01");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Inline Customer Drawer State
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [newCustFirstName, setNewCustFirstName] = useState("");
  const [newCustLastName, setNewCustLastName] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustStreet, setNewCustStreet] = useState("");
  const [newCustCity, setNewCustCity] = useState("");
  const [newCustState, setNewCustState] = useState("");
  const [newCustZip, setNewCustZip] = useState("");
  const [creatingCustLoading, setCreatingCustLoading] = useState(false);
  const [custCreateError, setCustCreateError] = useState<string | null>(null);

  // Header & Details
  const [projectTitle, setProjectTitle] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState("");
  const [showCcInput, setShowCcInput] = useState(false);
  const [clientMessage, setClientMessage] = useState(
    "We look forward to working with you. Thank you for your business."
  );
  const [autoConvert, setAutoConvert] = useState(true);

  // Dates
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [taxRatePercent, setTaxRatePercent] = useState(8.25);
  const [discountDollars, setDiscountDollars] = useState("0");
  const [notes, setNotes] = useState("");

  // Deposit Schedule State
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositType, setDepositType] = useState<DepositType>("percentage");
  const [depositValue, setDepositValue] = useState<number>(30);
  const [depositDueDays, setDepositDueDays] = useState<number>(0);
  const [balanceDueDays, setBalanceDueDays] = useState<number>(14);

  // Late Fee State
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false);
  const [lateFeeType, setLateFeeType] = useState<LateFeeType>("percentage");
  const [lateFeeValue, setLateFeeValue] = useState<number>(5);
  const [lateFeeGraceDays, setLateFeeGraceDays] = useState<number>(3);

  // Reminders State
  const [reminderRules, setReminderRules] = useState<ReminderRules>(DEFAULT_REMINDER_RULES);

  // Attachments State
  const [stagedAttachments, setStagedAttachments] = useState<StagedFile[]>([]);

  // Line Items
  const [lineItems, setLineItems] = useState<LineItemState[]>([
    {
      id: "1",
      category: "service",
      description: "Standard Field Service & Diagnostic Assessment",
      quantity: 1,
      unitPriceDollars: "150.00",
      note: "",
    },
  ]);

  // Drawer States
  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItemState | null>(null);

  const [depositDrawerOpen, setDepositDrawerOpen] = useState(false);
  const [lateFeeDrawerOpen, setLateFeeDrawerOpen] = useState(false);
  const [reminderDrawerOpen, setReminderDrawerOpen] = useState(false);

  // Saving / AI States
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [idpModalOpen, setIdpModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [stagedAiData, setStagedAiData] = useState<AIInvoiceExtraction | null>(null);
  const [aiConfirmed, setAiConfirmed] = useState(false);
  const [creationSource, setCreationSource] = useState("manual");
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);

  const [voiceTranscriptInput, setVoiceTranscriptInput] = useState(
    "Estimate for Marisol Vega at 3920 Garden Ave, Miami Beach. Water heater replacement. Calentador Bradford White RG275H6N for $1,838.96, Convenience fee for $125.00, Replacement labor for $1,900.00. 0 tax. Total $3,863.96."
  );
  const [idpDocInput, setIdpDocInput] = useState(
    "SUPPLY HOUSE RECEIPT\nBradford White RG275H6N $1838.96\nParts & Supplies $125.00"
  );

  useEffect(() => {
    const active = localStorage.getItem("active_org_id") || "org_apex_01";
    setOrgId(active);

    fetch(`/api/customers?orgId=${active}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.customers?.length > 0) {
          setCustomers(d.customers);
          setSelectedCustomerId(d.customers[0].id);
        }
      });
  }, []);

  // Compute deterministic cent totals
  const discountCents = parseDollarsToCents(discountDollars);
  const lineItemInputs = lineItems.map((it) => ({
    quantity: Number(it.quantity) || 0,
    unitPriceCents: parseDollarsToCents(it.unitPriceDollars),
  }));

  const totals = computeInvoiceTotals({
    lineItems: lineItemInputs,
    taxRatePercent,
    discountCents,
  });

  const depositSplit = depositEnabled
    ? computeDepositSplit(
        totals.totalAmountCents,
        depositType,
        depositType === "percentage" ? depositValue : parseDollarsToCents(String(depositValue))
      )
    : { depositAmountCents: 0, remainingBalanceCents: totals.totalAmountCents };

  // Item Drawer Actions
  const openNewItemDrawer = () => {
    setEditingItem({
      id: String(Date.now()),
      category: "service",
      description: "",
      quantity: 1,
      unitPriceDollars: "0.00",
      note: "",
    });
    setItemDrawerOpen(true);
  };

  const saveDrawerItem = () => {
    if (!editingItem) return;
    const exists = lineItems.some((it) => it.id === editingItem.id);
    if (exists) {
      setLineItems(lineItems.map((it) => (it.id === editingItem.id ? editingItem : it)));
    } else {
      setLineItems([...lineItems, editingItem]);
    }
    setItemDrawerOpen(false);
    setEditingItem(null);
  };

  const handleAddCc = () => {
    if (!newCcEmail || !newCcEmail.includes("@")) return;
    if (!ccEmails.includes(newCcEmail)) {
      setCcEmails([...ccEmails, newCcEmail]);
    }
    setNewCcEmail("");
  };

  const handleRemoveCc = (email: string) => {
    setCcEmails(ccEmails.filter((e) => e !== email));
  };

  // Submit document to API
  const handleSave = async (targetStatus: "draft" | "sent") => {
    if (!selectedCustomerId) {
      setSaveError("Please select a customer.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const payload = {
        organization_id: orgId,
        customer_id: selectedCustomerId,
        document_type: docType,
        document_status: targetStatus,
        project_title: projectTitle || null,
        custom_code: customCode || null,
        cc_emails: ccEmails,
        client_message: clientMessage,
        auto_convert_on_approval: autoConvert,
        issue_date: issueDate,
        tax_rate: taxRatePercent,
        discount_cents: discountCents,
        notes,
        creation_source: creationSource,
        ai_model_used: aiModelUsed,
        ai_human_confirmed: aiConfirmed,
        deposit_enabled: depositEnabled,
        deposit_type: depositType,
        deposit_value: depositType === "percentage" ? depositValue : parseDollarsToCents(String(depositValue)),
        deposit_due_days: depositDueDays,
        balance_due_days: balanceDueDays,
        late_fee_enabled: lateFeeEnabled,
        late_fee_type: lateFeeType,
        late_fee_value: lateFeeType === "percentage" ? lateFeeValue : parseDollarsToCents(String(lateFeeValue)),
        late_fee_grace_days: lateFeeGraceDays,
        reminder_rules: reminderRules,
        line_items: lineItems.map((it) => ({
          category: it.category,
          description: it.description || "Service item",
          note: it.note || null,
          quantity: Number(it.quantity) || 1,
          unit_price_cents: parseDollarsToCents(it.unitPriceDollars),
        })),
        attachments: stagedAttachments.map((a) => ({
          uploaded_by_role: "contractor",
          uploader_name: "Contractor",
          file_name: a.file_name,
          mime_type: a.mime_type,
          file_size_bytes: a.file_size_bytes,
          data_url_or_path: a.data_url_or_path,
          caption: a.caption || null,
        })),
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.invoice) {
        if (docType === "estimate") {
          router.push("/estimates");
        } else {
          router.push(`/invoices/${data.invoice.id}`);
        }
      } else {
        setSaveError(data.error || "Failed to save document.");
      }
    } catch (e: any) {
      setSaveError(e.message || "Network error while saving document.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header with Estimate/Invoice Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-field-border">
        <div className="flex items-center gap-3">
          <Link
            href={docType === "estimate" ? "/estimates" : "/dashboard"}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-field-text tracking-tight flex items-center gap-2">
                <span>{docType === "estimate" ? "New Estimate" : "New Invoice"}</span>
              </h1>
              {/* Type Switcher Segmented Control */}
              <Segmented
                value={docType}
                onChange={(t) => setDocType(t as DocumentType)}
                options={[
                  { value: "estimate", label: "Estimate" },
                  { value: "invoice", label: "Invoice" },
                ]}
              />
            </div>
            <p className="text-xs text-field-muted mt-1">
              Zero-friction mobile contractor builder &bull; Deterministic cent math &bull; Two-way attachments
            </p>
          </div>
        </div>

        {/* AI Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVoiceModalOpen(true)}
            className="touch-target px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Mic className="w-4 h-4 text-agios-blue" />
            <span>Voice-to-Doc</span>
          </button>

          <button
            type="button"
            onClick={() => setIdpModalOpen(true)}
            className="touch-target px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <FileUp className="w-4 h-4 text-agios-cyan" />
            <span>Receipt / IDP</span>
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer, Project & Recipients */}
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              1. Customer, Project & Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Record *
                </label>
                {(() => {
                  const currentCust = customers.find((c) => c.id === selectedCustomerId);
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNewCustomer(false);
                          setCustomerModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg border border-field-border bg-field-canvas hover:border-agios-blue text-left transition-colors text-xs"
                      >
                        {currentCust ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-agios-blue/10 text-agios-blue font-bold flex items-center justify-center text-[10px] shrink-0">
                              {currentCust.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900 truncate">
                              {currentCust.name} {currentCust.company_name ? `(${currentCust.company_name})` : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">+ Add a customer</span>
                        )}
                        <span className="text-[11px] text-agios-blue font-bold ml-2 shrink-0">
                          {currentCust ? "Change" : "Select"}
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom {docType === "estimate" ? "Estimate" : "Invoice"} ID
                </label>
                <input
                  type="text"
                  placeholder={docType === "estimate" ? "#3060" : "#2049"}
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-field-border text-xs font-mono bg-field-canvas"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Title / Service Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3920 Garden Ave, Miami Beach, FL 33140"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-field-border text-xs bg-field-canvas"
                />
              </div>

              {/* CC Recipients */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">Additional Recipients (CC)</span>
                  {!showCcInput && (
                    <button
                      type="button"
                      onClick={() => setShowCcInput(true)}
                      className="text-xs text-agios-blue font-semibold hover:underline"
                    >
                      + Add additional recipients
                    </button>
                  )}
                </div>

                {showCcInput && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={newCcEmail}
                      onChange={(e) => setNewCcEmail(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-field-border text-xs bg-field-canvas"
                    />
                    <button
                      type="button"
                      onClick={handleAddCc}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>
                )}

                {ccEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ccEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveCc(email)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Client Message */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Message
                </label>
                <textarea
                  rows={2}
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-field-border text-xs bg-field-canvas"
                />
              </div>

              {/* Auto convert on approval toggle for estimates */}
              {docType === "estimate" && (
                <div className="sm:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <Toggle
                    checked={autoConvert}
                    onChange={setAutoConvert}
                    label="Automatically convert to invoice when client approves"
                    hint="Generates an invoice with identical line items, deposit schedules and attachments."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Line Items with Oversized Quick Drawer */}
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                2. Itemized Line Items
              </h2>
              <button
                type="button"
                onClick={openNewItemDrawer}
                className="touch-target px-3.5 py-2 rounded-lg bg-agios-blue hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add another item</span>
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => {
                const itemTotalCents = computeLineTotalCents(
                  Number(item.quantity) || 0,
                  parseDollarsToCents(item.unitPriceDollars)
                );

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Line #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem({ ...item });
                            setItemDrawerOpen(true);
                          }}
                          className="text-agios-blue hover:underline text-xs"
                        >
                          Edit
                        </button>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLineItems(lineItems.filter((it) => it.id !== item.id))}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <span className="block text-[11px] font-medium text-slate-500 mb-1">Category</span>
                        <span className="inline-block px-2 py-1 rounded bg-slate-200 text-slate-800 text-xs font-mono uppercase">
                          {item.category}
                        </span>
                      </div>
                      <div className="sm:col-span-9">
                        <span className="block text-[11px] font-medium text-slate-500 mb-1">Description</span>
                        <div className="font-medium text-slate-900 text-xs">{item.description || "—"}</div>
                        {item.note && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">{item.note}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs font-mono">
                      <span className="text-slate-500">
                        Qty: <strong>{item.quantity}</strong> &times; ${item.unitPriceDollars}
                      </span>
                      <span className="font-bold text-slate-900">{formatCents(itemTotalCents)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Contractor Attachments */}
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                3. Attachments & Photos (Two-Way)
              </h2>
            </div>
            <FileDrop
              onFiles={(files) => setStagedAttachments([...stagedAttachments, ...files])}
              label="Drop job-site photos, scope docs or model plates (PDF / PNG / JPG)"
            />
            {stagedAttachments.length > 0 && (
              <div className="space-y-1 pt-2">
                <span className="text-xs font-semibold text-slate-700">Staged Files ({stagedAttachments.length}):</span>
                {stagedAttachments.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs font-mono">
                    <span className="truncate">{f.file_name} ({(f.file_size_bytes / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => setStagedAttachments(stagedAttachments.filter((_, idx) => idx !== i))}
                      className="text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Summary, Schedule & Dispatch */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-field-border p-5 shadow-sm space-y-4 sticky top-24">
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center justify-between">
              <span>Financial Totals</span>
              <Calculator className="w-4 h-4 text-slate-400" />
            </h2>

            <div className="space-y-3 text-xs divide-y divide-slate-100 font-mono">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">{formatCents(totals.subtotalCents)}</span>
              </div>

              <div className="flex justify-between py-2 items-center text-slate-600">
                <span>Discount ($):</span>
                <input
                  type="text"
                  value={discountDollars}
                  onChange={(e) => setDiscountDollars(e.target.value)}
                  className="w-20 px-2 py-1 text-right rounded border border-field-border text-xs font-mono"
                />
              </div>

              <div className="flex justify-between py-2 items-center text-slate-600">
                <span>Tax Rate (%):</span>
                <input
                  type="number"
                  step="0.01"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-right rounded border border-field-border text-xs font-mono"
                />
              </div>

              <div className="flex justify-between py-1 text-slate-600">
                <span>Tax Amount:</span>
                <span className="font-bold text-slate-900">{formatCents(totals.taxAmountCents)}</span>
              </div>

              <div className="flex justify-between pt-3 text-sm font-bold text-slate-900 border-t-2 border-slate-900">
                <span>Total Amount:</span>
                <span className="text-agios-blue">{formatCents(totals.totalAmountCents)}</span>
              </div>
            </div>

            {/* Quick Drawers Triggers */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              {/* Deposit Schedule Trigger */}
              <button
                type="button"
                onClick={() => setDepositDrawerOpen(true)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Percent className="w-3.5 h-3.5 text-agios-blue" />
                  <span className="font-semibold text-slate-800">Deposit & Schedule</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {depositEnabled ? `${formatCents(depositSplit.depositAmountCents)} deposit` : "Off >"}
                </span>
              </button>

              {/* Late Fee Trigger */}
              <button
                type="button"
                onClick={() => setLateFeeDrawerOpen(true)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-semibold text-slate-800">Late Fees</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {lateFeeEnabled ? `${lateFeeType === "percentage" ? `${lateFeeValue}%` : `$${lateFeeValue}`} / ${lateFeeGraceDays}d grace` : "Off >"}
                </span>
              </button>

              {/* Reminders Trigger */}
              <button
                type="button"
                onClick={() => setReminderDrawerOpen(true)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Automated Reminders</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {reminderRules.enabled ? "Active >" : "Off >"}
                </span>
              </button>
            </div>

            {/* Action Buttons: Save Draft vs Save & Send */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave("sent")}
                className="touch-target w-full py-3 rounded-lg bg-agios-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{saving ? "Publishing..." : `Save & Send ${docType === "estimate" ? "Estimate" : "Invoice"}`}</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave("draft")}
                className="touch-target w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Save as Draft</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SLIDE-OVER DRAWER: Add / Edit Line Item
         ========================================================================= */}
      <Drawer
        open={itemDrawerOpen}
        onClose={() => setItemDrawerOpen(false)}
        title={editingItem && lineItems.some((it) => it.id === editingItem.id) ? "Edit Item" : "Add Line Item"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setItemDrawerOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDrawerItem}
              className="px-4 py-2 rounded-lg bg-agios-blue text-white text-xs font-bold shadow"
            >
              Save Item
            </button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            {/* Oversized Price Input */}
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                Unit Price
              </span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-slate-400">$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={editingItem.unitPriceDollars}
                  onChange={(e) => setEditingItem({ ...editingItem, unitPriceDollars: e.target.value })}
                  className="w-48 text-3xl font-black text-slate-900 text-center font-mono bg-transparent border-b-2 border-agios-blue focus:outline-none"
                />
              </div>
            </div>

            {/* Stepper for Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditingItem({
                      ...editingItem,
                      quantity: Math.max(0.5, Number(editingItem.quantity || 1) - 1),
                    })
                  }
                  className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-lg font-bold flex items-center justify-center border border-slate-300"
                >
                  &minus;
                </button>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.quantity}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })
                  }
                  className="flex-1 py-2 text-center rounded-lg border border-slate-300 font-mono text-sm font-bold"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEditingItem({
                      ...editingItem,
                      quantity: Number(editingItem.quantity || 0) + 1,
                    })
                  }
                  className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-lg font-bold flex items-center justify-center border border-slate-300"
                >
                  &#43;
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={editingItem.category}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, category: e.target.value as LineItemState["category"] })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="service">Service</option>
                <option value="material">Material</option>
                <option value="labor">Labor</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description</label>
              <input
                type="text"
                placeholder="e.g. Bradford White RG275H6N Water Heater"
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item Note</label>
              <textarea
                rows={2}
                placeholder="Add an item note (specs, haul-away, warranty)..."
                value={editingItem.note || ""}
                onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* =========================================================================
          DRAWER: Deposits & Payment Schedule
         ========================================================================= */}
      <Drawer
        open={depositDrawerOpen}
        onClose={() => setDepositDrawerOpen(false)}
        title="Deposit & Payment Schedule"
        footer={
          <button
            type="button"
            onClick={() => setDepositDrawerOpen(false)}
            className="w-full py-2.5 rounded-lg bg-agios-blue text-white text-xs font-bold shadow"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4 text-xs">
          <Toggle
            checked={depositEnabled}
            onChange={setDepositEnabled}
            label="Require Upfront Deposit"
            hint="Splits payment into upfront deposit and remaining balance."
          />

          {depositEnabled && (
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <div>
                <span className="block text-slate-700 font-semibold mb-1">Deposit Type</span>
                <Segmented
                  value={depositType}
                  onChange={(t) => setDepositType(t as DepositType)}
                  options={[
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "flat_cents", label: "Flat Amount ($)" },
                  ]}
                />
              </div>

              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Deposit Value ({depositType === "percentage" ? "%" : "$"})
                </span>
                <input
                  type="number"
                  step={depositType === "percentage" ? "1" : "0.01"}
                  value={depositValue}
                  onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <span className="block text-slate-700 font-semibold mb-1">Deposit Due Terms</span>
                <select
                  value={depositDueDays}
                  onChange={(e) => setDepositDueDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value={0}>Upon invoice date (Immediate)</option>
                  <option value={1}>1 day after invoice date</option>
                  <option value={7}>7 days after invoice date</option>
                  <option value={14}>14 days after invoice date</option>
                </select>
              </div>

              <div>
                <span className="block text-slate-700 font-semibold mb-1">Remaining Balance Due Terms</span>
                <select
                  value={balanceDueDays}
                  onChange={(e) => setBalanceDueDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value={1}>1 day after invoice date</option>
                  <option value={7}>7 days after invoice date</option>
                  <option value={14}>14 days after invoice date</option>
                  <option value={30}>30 days after invoice date</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono">
                Request {formatCents(depositSplit.depositAmountCents)} deposit on {formatCents(totals.totalAmountCents)} total.
                Remaining balance of {formatCents(depositSplit.remainingBalanceCents)} due in {balanceDueDays} days.
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* =========================================================================
          DRAWER: Late Fees
         ========================================================================= */}
      <Drawer
        open={lateFeeDrawerOpen}
        onClose={() => setLateFeeDrawerOpen(false)}
        title="Automated Late Fee Rules"
        footer={
          <button
            type="button"
            onClick={() => setLateFeeDrawerOpen(false)}
            className="w-full py-2.5 rounded-lg bg-agios-blue text-white text-xs font-bold shadow"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4 text-xs">
          <Toggle
            checked={lateFeeEnabled}
            onChange={setLateFeeEnabled}
            label="Enable Late Fee Protection"
            hint="Applies automatic late fees when invoices exceed grace periods."
          />

          {lateFeeEnabled && (
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <div>
                <span className="block text-slate-700 font-semibold mb-1">Fee Type</span>
                <Segmented
                  value={lateFeeType}
                  onChange={(t) => setLateFeeType(t as LateFeeType)}
                  options={[
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "flat_cents", label: "Flat Amount ($)" },
                  ]}
                />
              </div>

              <div>
                <span className="block text-slate-700 font-semibold mb-1">
                  Fee Value ({lateFeeType === "percentage" ? "%" : "$"})
                </span>
                <input
                  type="number"
                  step={lateFeeType === "percentage" ? "1" : "0.01"}
                  value={lateFeeValue}
                  onChange={(e) => setLateFeeValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <span className="block text-slate-700 font-semibold mb-1">Grace Period (Days)</span>
                <select
                  value={lateFeeGraceDays}
                  onChange={(e) => setLateFeeGraceDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value={1}>1 day grace</option>
                  <option value={3}>3 days grace (Standard)</option>
                  <option value={7}>7 days grace</option>
                  <option value={14}>14 days grace</option>
                  <option value={30}>30 days grace</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                Works seamlessly with active deposit schedules. Calculates against the specific overdue stage (unpaid deposit or remaining balance).
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* =========================================================================
          DRAWER: Reminders
         ========================================================================= */}
      <Drawer
        open={reminderDrawerOpen}
        onClose={() => setReminderDrawerOpen(false)}
        title="Automated Reminder Schedule"
        footer={
          <button
            type="button"
            onClick={() => setReminderDrawerOpen(false)}
            className="w-full py-2.5 rounded-lg bg-agios-blue text-white text-xs font-bold shadow"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4 text-xs">
          <Toggle
            checked={reminderRules.enabled}
            onChange={(v) => setReminderRules({ ...reminderRules, enabled: v })}
            label="Enable Automated Reminders"
            hint="Dispatches scheduled notices before and after deadlines."
          />

          {reminderRules.enabled && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="font-semibold text-slate-800 block">
                {docType === "estimate" ? "Estimate Reminders" : "Invoice Reminders"}
              </span>
              <p className="text-slate-500 text-[11px]">
                Reminders are automatically skipped if the client has already paid or approved the document.
              </p>
            </div>
          )}
        </div>
      </Drawer>

      {/* AI Extraction Modal (Voice / IDP) */}
      {voiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-agios-blue" />
                <h3 className="text-base font-bold text-slate-900">Voice-to-Document Extraction</h3>
              </div>
              <button onClick={() => setVoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <textarea
              rows={4}
              value={voiceTranscriptInput}
              onChange={(e) => setVoiceTranscriptInput(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs font-mono"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setVoiceModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
              <button
                disabled={aiLoading}
                onClick={async () => {
                  setAiLoading(true);
                  try {
                    const res = await fetch("/api/ai/voice-to-invoice", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ transcript: voiceTranscriptInput }),
                    });
                    const d = await res.json();
                    if (d.success && d.data) {
                      setLineItems(d.data.lineItems.map((li: any, idx: number) => ({
                        id: String(Date.now() + idx),
                        category: li.category || "service",
                        description: li.description,
                        quantity: li.quantity || 1,
                        unitPriceDollars: li.unitPriceCents ? (li.unitPriceCents / 100).toFixed(2) : "0.00",
                      })));
                      setVoiceModalOpen(false);
                    }
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className="px-4 py-2 bg-agios-blue text-white rounded-lg text-xs font-bold"
              >
                {aiLoading ? "Extracting..." : "Apply Extraction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {idpModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-agios-cyan" />
                <h3 className="text-base font-bold text-slate-900">IDP Document Scan</h3>
              </div>
              <button onClick={() => setIdpModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <textarea
              rows={4}
              value={idpDocInput}
              onChange={(e) => setIdpDocInput(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs font-mono"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIdpModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
              <button
                disabled={aiLoading}
                onClick={async () => {
                  setAiLoading(true);
                  try {
                    const res = await fetch("/api/ai/idp-extract", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ documentText: idpDocInput }),
                    });
                    const d = await res.json();
                    if (d.success && d.data) {
                      setLineItems(d.data.lineItems.map((li: any, idx: number) => ({
                        id: String(Date.now() + idx),
                        category: li.category || "service",
                        description: li.description,
                        quantity: li.quantity || 1,
                        unitPriceDollars: li.unitPriceCents ? (li.unitPriceCents / 100).toFixed(2) : "0.00",
                      })));
                      setIdpModalOpen(false);
                    }
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className="px-4 py-2 bg-agios-cyan text-white rounded-lg text-xs font-bold"
              >
                {aiLoading ? "Extracting..." : "Apply Extraction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection & Inline Creation Slide-over Modal */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-agios-blue/10 text-agios-blue flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isCreatingNewCustomer ? "New Customer" : "Select Customer"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isCreatingNewCustomer
                      ? "Create and attach customer without losing draft changes."
                      : "Choose a customer or create a new contact."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomerModalOpen(false);
                  setIsCreatingNewCustomer(false);
                  setCustCreateError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {!isCreatingNewCustomer ? (
                <>
                  {/* Action Bar: Search & New Customer Button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search customers by name, company, email..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-field-canvas focus:ring-2 focus:ring-agios-blue/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCustomer(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-agios-blue text-white text-xs font-semibold hover:bg-blue-600 transition-colors shrink-0 shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ New customer</span>
                    </button>
                  </div>

                  {/* Customer List */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      {customerSearchQuery ? "Matching Customers" : "Recently Created"}
                    </div>
                    {customers
                      .filter((c) => {
                        if (!customerSearchQuery.trim()) return true;
                        const q = customerSearchQuery.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(q) ||
                          (c.company_name && c.company_name.toLowerCase().includes(q)) ||
                          (c.email && c.email.toLowerCase().includes(q)) ||
                          (c.phone && c.phone.toLowerCase().includes(q))
                        );
                      })
                      .map((cust) => {
                        const initials = cust.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                        const isSelected = cust.id === selectedCustomerId;
                        return (
                          <div
                            key={cust.id}
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              setCustomerModalOpen(false);
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-agios-blue bg-blue-50/50 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-agios-blue text-white shadow-sm"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {cust.name}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {cust.company_name ? `${cust.company_name} • ` : ""}
                                  {cust.email || cust.phone || "No contact info"}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-[11px] font-bold text-agios-blue bg-white px-2 py-0.5 rounded-full border border-agios-blue/30 shrink-0">
                                Selected
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                /* Nested New Customer Form */
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newCustFirstName.trim()) {
                      setCustCreateError("First name is required.");
                      return;
                    }
                    setCreatingCustLoading(true);
                    setCustCreateError(null);
                    try {
                      const fullName = `${newCustFirstName.trim()} ${newCustLastName.trim()}`.trim();
                      const fullAddress = [
                        newCustStreet.trim(),
                        newCustCity.trim(),
                        newCustState.trim(),
                        newCustZip.trim(),
                      ]
                        .filter(Boolean)
                        .join(", ");

                      const res = await fetch("/api/customers", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          organization_id: orgId,
                          name: fullName,
                          company_name: newCustCompany.trim() || null,
                          email: newCustEmail.trim() || null,
                          phone: newCustPhone.trim() || null,
                          service_address: fullAddress || null,
                        }),
                      });
                      const data = await res.json();
                      if (data.success && data.customer) {
                        const newC: CustomerOption = {
                          id: data.customer.id,
                          name: data.customer.name,
                          company_name: data.customer.company_name,
                          email: data.customer.email,
                          phone: data.customer.phone,
                          service_address: data.customer.service_address,
                        };
                        setCustomers([newC, ...customers]);
                        setSelectedCustomerId(newC.id);
                        setIsCreatingNewCustomer(false);
                        setCustomerModalOpen(false);
                        // Reset fields
                        setNewCustFirstName("");
                        setNewCustLastName("");
                        setNewCustCompany("");
                        setNewCustEmail("");
                        setNewCustPhone("");
                        setNewCustStreet("");
                        setNewCustCity("");
                        setNewCustState("");
                        setNewCustZip("");
                      } else {
                        setCustCreateError(data.error || "Failed to create customer");
                      }
                    } catch (err: any) {
                      setCustCreateError(err.message || "Failed to create customer");
                    } finally {
                      setCreatingCustLoading(false);
                    }
                  }}
                  className="space-y-3"
                >
                  {custCreateError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {custCreateError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Tatiana"
                        value={newCustFirstName}
                        onChange={(e) => setNewCustFirstName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-field-canvas"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Ruiz"
                        value={newCustLastName}
                        onChange={(e) => setNewCustLastName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-field-canvas"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ruiz Design Studio"
                      value={newCustCompany}
                      onChange={(e) => setNewCustCompany(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-field-canvas"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="tatiana@example.com"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-field-canvas"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="(404) 952-3973"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-field-canvas"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Service / Billing Address
                    </span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Street address (e.g. 4499 NW 82nd Ave)"
                        value={newCustStreet}
                        onChange={(e) => setNewCustStreet(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-field-canvas"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="City (e.g. Doral)"
                          value={newCustCity}
                          onChange={(e) => setNewCustCity(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-field-canvas"
                        />
                        <input
                          type="text"
                          placeholder="State (e.g. FL)"
                          value={newCustState}
                          onChange={(e) => setNewCustState(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-field-canvas"
                        />
                        <input
                          type="text"
                          placeholder="ZIP (e.g. 33166)"
                          value={newCustZip}
                          onChange={(e) => setNewCustZip(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-field-canvas"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCustomer(false)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Back to Search
                    </button>
                    <button
                      type="submit"
                      disabled={creatingCustLoading}
                      className="px-4 py-1.5 rounded-lg bg-agios-blue text-white text-xs font-bold hover:bg-blue-600 disabled:opacity-50"
                    >
                      {creatingCustLoading ? "Saving Customer..." : "Save Customer"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
