-- ==============================================================================
-- INVOICE PRO AGIOS — POSTGRESQL SCHEMA (Session 1 Specification)
-- Stripe Connect v2 + 5-State Payment Model + Immutable Audit Log
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZATIONS (Isolated Multi-Tenant Contractor Accounts)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  logo_url TEXT,
  brand_primary_color TEXT DEFAULT '#2563EB',
  default_tax_rate NUMERIC(5, 2) DEFAULT 0.00,
  default_payment_terms_days INTEGER DEFAULT 14,
  -- Flow A: SaaS Platform Subscription Billing (Contractor -> AGIOS Platform)
  saas_stripe_customer_id TEXT,
  saas_subscription_status TEXT DEFAULT 'prototype_eval'
    CHECK (saas_subscription_status IN ('prototype_eval', 'trialing', 'active', 'past_due', 'canceled')),
  -- Flow B: Contractor Connected Account via Stripe Accounts v2 (Customer -> Contractor Direct Charge)
  -- NOTE: Never store contractor secret API keys. Only store the connected account ID (acct_...).
  stripe_v2_account_id TEXT,
  stripe_v2_merchant_capability_status TEXT DEFAULT 'not_connected'
    CHECK (stripe_v2_merchant_capability_status IN ('not_connected', 'onboarding_pending', 'restricted', 'active_test')),
  stripe_charge_mode TEXT DEFAULT 'direct_charge'
    CHECK (stripe_charge_mode IN ('direct_charge', 'simulated')),
  reminder_engine_enabled BOOLEAN DEFAULT true,
  reminder_schedule_days INTEGER[] DEFAULT ARRAY[-3, 0, 3, 7],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CUSTOMERS (Tenant-Isolated CRM Records)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  service_address TEXT,
  notes TEXT,
  total_billed_cents BIGINT NOT NULL DEFAULT 0,
  total_paid_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);

-- 3. INVOICES (Deterministic Cent-Math + Explicit 5-State Payment Status)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  public_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex') UNIQUE,
  -- Document Lifecycle State
  document_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (document_status IN ('draft', 'ready_to_send', 'sent', 'viewed', 'void')),
  -- Explicit 5-State Payment State Machine (Required by Session 1 Spec)
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  -- Deterministic Financial Totals (Integer Cents)
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  discount_cents BIGINT NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  tax_amount_cents BIGINT NOT NULL DEFAULT 0,
  total_amount_cents BIGINT NOT NULL DEFAULT 0,
  amount_paid_cents BIGINT NOT NULL DEFAULT 0,
  amount_refunded_cents BIGINT NOT NULL DEFAULT 0,
  balance_due_cents BIGINT NOT NULL DEFAULT 0,
  -- Stripe v2 Direct Charge Metadata
  payment_method_type TEXT CHECK (payment_method_type IN ('stripe_direct_charge', 'simulated_card', 'simulated_ach', 'offline_cash_check_zelle')),
  stripe_connected_account_id TEXT,
  stripe_payment_intent_id TEXT,
  last_payment_error TEXT,
  -- AI Provenance & Mandatory Contractor Confirmation Audit
  creation_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (creation_source IN ('manual', 'voice_to_invoice', 'idp_document')),
  ai_model_used TEXT,
  ai_human_confirmed BOOLEAN NOT NULL DEFAULT false,
  ai_confirmed_at TIMESTAMPTZ,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_invoice_per_org UNIQUE(organization_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_org_payment_status ON invoices(organization_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_public_token ON invoices(public_token);

-- 4. INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'service' CHECK (category IN ('service', 'material', 'labor', 'equipment')),
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity >= 0),
  unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0),
  line_total_cents BIGINT NOT NULL CHECK (line_total_cents >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. IMMUTABLE INVOICE TIMELINE & AUDIT LOG
CREATE TABLE IF NOT EXISTS invoice_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'invoice_created', 'invoice_edited', 'ai_extraction_staged',
    'ai_extraction_confirmed', 'invoice_sent_sandbox', 'public_page_viewed',
    'payment_pending', 'payment_processing', 'payment_succeeded',
    'payment_failed', 'payment_refunded', 'reminder_logged'
  )),
  actor TEXT NOT NULL DEFAULT 'contractor',
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
