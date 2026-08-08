-- ========================================================
-- SELF-HEALING PRE-CHECK: RENAME user_uuid TO user_id
-- ========================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND column_name = 'user_uuid'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' RENAME COLUMN user_uuid TO user_id';
    END LOOP;
END$$;

-- ========================================================
-- MIGRATION: 20260806152651_7102ae6b-479a-4ff1-a48c-d9aae6c00f3c.sql
-- ========================================================

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  country TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP TRIGGER IF EXISTS profiles_updated ON public.profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
        CREATE TYPE public.kyc_status AS ENUM ('not_started','pending','approved','rejected');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  nationality TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  occupation TEXT,
  employment_status TEXT,
  source_of_funds TEXT,
  id_document_type TEXT,
  id_document_number TEXT,
  id_document_url TEXT,
  is_business BOOLEAN NOT NULL DEFAULT false,
  business_name TEXT,
  business_registration_number TEXT,
  business_country TEXT,
  business_website TEXT,
  status public.kyc_status NOT NULL DEFAULT 'not_started',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc TO authenticated;
GRANT ALL ON public.kyc TO service_role;
ALTER TABLE public.kyc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own kyc" ON public.kyc;
CREATE POLICY "own kyc" ON public.kyc FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS kyc_updated ON public.kyc;
CREATE TRIGGER kyc_updated BEFORE UPDATE ON public.kyc FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.fiat_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  currency TEXT NOT NULL,
  label TEXT,
  balance NUMERIC(20,2) NOT NULL DEFAULT 0,
  available_balance NUMERIC(20,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiat_wallets TO authenticated;
GRANT ALL ON public.fiat_wallets TO service_role;
ALTER TABLE public.fiat_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own fiat wallets" ON public.fiat_wallets;
CREATE POLICY "own fiat wallets" ON public.fiat_wallets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS fiat_wallets_updated ON public.fiat_wallets;
CREATE TRIGGER fiat_wallets_updated BEFORE UPDATE ON public.fiat_wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  asset TEXT NOT NULL,
  network TEXT,
  label TEXT,
  balance NUMERIC(36,8) NOT NULL DEFAULT 0,
  deposit_address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crypto_wallets TO authenticated;
GRANT ALL ON public.crypto_wallets TO service_role;
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own crypto wallets" ON public.crypto_wallets;
CREATE POLICY "own crypto wallets" ON public.crypto_wallets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS crypto_wallets_updated ON public.crypto_wallets;
CREATE TRIGGER crypto_wallets_updated BEFORE UPDATE ON public.crypto_wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.virtual_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  currency TEXT NOT NULL,
  account_name TEXT,
  account_number TEXT NOT NULL,
  routing_number TEXT,
  iban TEXT,
  swift_bic TEXT,
  bank_name TEXT,
  bank_address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_accounts TO authenticated;
GRANT ALL ON public.virtual_accounts TO service_role;
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own virtual accounts" ON public.virtual_accounts;
CREATE POLICY "own virtual accounts" ON public.virtual_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS virtual_accounts_updated ON public.virtual_accounts;
CREATE TRIGGER virtual_accounts_updated BEFORE UPDATE ON public.virtual_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE public.transaction_type AS ENUM ('deposit','withdrawal','exchange','send','receive');
    END IF;
END$$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE public.transaction_status AS ENUM ('pending','completed','failed','cancelled');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  amount NUMERIC(36,8) NOT NULL,
  currency TEXT NOT NULL,
  to_amount NUMERIC(36,8),
  to_currency TEXT,
  rate NUMERIC(20,8),
  fee NUMERIC(20,8) NOT NULL DEFAULT 0,
  reference TEXT NOT NULL DEFAULT ('TX-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  description TEXT,
  counterparty TEXT,
  beneficiary_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own transactions" ON public.transactions;
CREATE POLICY "own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS transactions_updated ON public.transactions;
CREATE TRIGGER transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS transactions_user_created_idx ON public.transactions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank',
  currency TEXT,
  email TEXT,
  bank_name TEXT,
  account_number TEXT,
  routing_number TEXT,
  iban TEXT,
  swift_bic TEXT,
  country TEXT,
  crypto_asset TEXT,
  crypto_network TEXT,
  crypto_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiaries TO authenticated;
GRANT ALL ON public.beneficiaries TO service_role;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own beneficiaries" ON public.beneficiaries;
CREATE POLICY "own beneficiaries" ON public.beneficiaries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS beneficiaries_updated ON public.beneficiaries;
CREATE TRIGGER beneficiaries_updated BEFORE UPDATE ON public.beneficiaries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS beneficiary_id UUID;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_beneficiary_fk;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_beneficiary_fk FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiaries(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  transaction_alerts BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own settings" ON public.settings;
CREATE POLICY "own settings" ON public.settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS settings_updated ON public.settings;
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.kyc (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- MIGRATION: 20260806152710_b61b829c-c585-4434-9751-7c9713a02371.sql
-- ========================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- ========================================================
-- MIGRATION: 20260806152800_missing_tables.sql
-- ========================================================

-- Add kyc_completed and profile_completed flags to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN NOT NULL DEFAULT false;

-- Create exchange_orders table
CREATE TABLE IF NOT EXISTS public.exchange_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  from_amount NUMERIC(36,8) NOT NULL,
  to_amount NUMERIC(36,8) NOT NULL,
  rate NUMERIC(20,8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and permissions for exchange_orders
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exchange_orders TO authenticated;
GRANT ALL ON public.exchange_orders TO service_role;
ALTER TABLE public.exchange_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own exchange orders" ON public.exchange_orders;
CREATE POLICY "own exchange orders" ON public.exchange_orders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'bank_account', 'card', 'crypto_address'
  provider TEXT,      -- e.g., 'plaid', 'stripe', 'nexus'
  name TEXT NOT NULL,
  account_last4 TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and permissions for payment_methods
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own payment methods" ON public.payment_methods;
CREATE POLICY "own payment methods" ON public.payment_methods FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create wallets view (unifying fiat_wallets and crypto_wallets)
CREATE OR REPLACE VIEW public.wallets AS
SELECT 
  id,
  user_id,
  currency AS asset,
  'fiat' AS type,
  balance,
  is_active,
  created_at,
  updated_at
FROM public.fiat_wallets
UNION ALL
SELECT 
  id,
  user_id,
  asset,
  'crypto' AS type,
  balance,
  is_active,
  created_at,
  updated_at
FROM public.crypto_wallets;


-- ========================================================
-- MIGRATION: 20260806152810_webhook_fields.sql
-- ========================================================

-- Add Unit and Currencycloud tracking columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_application_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currencycloud_account_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currencycloud_contact_id TEXT;


-- ========================================================
-- MIGRATION: 20260806175000_add_missing_tables.sql
-- ========================================================

-- Migration to add missing tables: notifications, audit_logs, webhooks

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
-- Webhooks are internal, no public access


-- ========================================================
-- MIGRATION: 20260806175500_add_provider_tables.sql
-- ========================================================

-- Add provider tables: wallet_addresses and provider_configs

CREATE TABLE IF NOT EXISTS public.wallet_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    crypto_wallet_id UUID REFERENCES public.crypto_wallets(id) ON DELETE SET NULL,
    asset VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    network VARCHAR(50) NOT NULL,
    destination_tag VARCHAR(100),
    derivation_path VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, asset, address)
);

CREATE TABLE IF NOT EXISTS public.provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL UNIQUE,
    config JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wallet addresses" ON public.wallet_addresses;
CREATE POLICY "Users can view their own wallet addresses" ON public.wallet_addresses FOR SELECT USING (auth.uid() = user_id);
-- provider_configs are internal metadata, disable public access


-- ========================================================
-- MIGRATION: 20260807071000_unipayment_merchant_tables.sql
-- ========================================================

-- Create types and roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('individual', 'merchant', 'admin', 'support');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'approved', 'rejected');
    END IF;
END$$;

-- Create users core mapping
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'individual' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'unverified' NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_customer_id VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currencycloud_contact_id VARCHAR(100);

-- Create business profiles (merchants)
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    registration_number VARCHAR(100) NOT NULL,
    tax_id VARCHAR(100),
    website TEXT,
    industry_type VARCHAR(100),
    incorporation_country VARCHAR(2) NOT NULL,
    registered_address TEXT NOT NULL,
    verification_status verification_status DEFAULT 'unverified' NOT NULL,
    currencycloud_account_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create KYC records
CREATE TABLE IF NOT EXISTS public.kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sumsub_applicant_id VARCHAR(100) UNIQUE,
    status verification_status DEFAULT 'pending' NOT NULL,
    reject_reason TEXT,
    payload JSONB,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create KYB records
CREATE TABLE IF NOT EXISTS public.kyb_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    sumsub_applicant_id VARCHAR(100) UNIQUE,
    status verification_status DEFAULT 'pending' NOT NULL,
    reject_reason TEXT,
    payload JSONB,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Merchant API Keys
CREATE TABLE IF NOT EXISTS public.merchant_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    api_key_hash VARCHAR(255) UNIQUE NOT NULL,
    api_key_prefix VARCHAR(10) NOT NULL,
    is_live BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Webhook Events
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    endpoint_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    attempts INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyb_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Simple select policies
DROP POLICY IF EXISTS "Users can view their own record" ON public.users;
CREATE POLICY "Users can view their own record" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Merchants can view their business profile" ON public.business_profiles;
CREATE POLICY "Merchants can view their business profile" ON public.business_profiles FOR SELECT USING (auth.uid() = merchant_id);
DROP POLICY IF EXISTS "Users can view their KYC records" ON public.kyc_records;
CREATE POLICY "Users can view their KYC records" ON public.kyc_records FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Merchants can view their API keys" ON public.merchant_api_keys;
CREATE POLICY "Merchants can view their API keys" ON public.merchant_api_keys FOR SELECT USING (auth.uid() = merchant_id);


-- ========================================================
-- MIGRATION: 20260807073000_add_invoices_reports.sql
-- ========================================================

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(36,18) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'paid', 'expired', 'failed'
    customer_email VARCHAR(255) NOT NULL,
    payment_address TEXT,
    virtual_account_id UUID REFERENCES public.virtual_accounts(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can manage their own invoices" ON public.invoices;
CREATE POLICY "Merchants can manage their own invoices" ON public.invoices FOR ALL USING (auth.uid() = merchant_id);


-- ========================================================
-- MIGRATION: 20260807081500_add_role_to_profiles.sql
-- ========================================================

-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50);


-- ========================================================
-- MIGRATION: 20260807090000_update_kyc_records.sql
-- ========================================================

-- 1. Create verification_status enum if it doesn't exist, and ensure all values are present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'approved', 'rejected');
    END IF;
END$$;

ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'unverified';
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'rejected';

-- 2. Create public.kyc_records table if it does not exist
CREATE TABLE IF NOT EXISTS public.kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_reference VARCHAR(100) UNIQUE,
    status verification_status DEFAULT 'pending' NOT NULL,
    rejection_reason TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    document_type TEXT,
    document_url TEXT,
    provider TEXT DEFAULT 'sumsub'
);

-- 3. If public.kyc_records existed but had the old structure, perform the migrations safely:
DO $$
BEGIN
    -- Rename profile_id to user_id
    BEGIN
        ALTER TABLE public.kyc_records RENAME COLUMN profile_id TO user_id;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;

    -- Rename sumsub_applicant_id to provider_reference
    BEGIN
        ALTER TABLE public.kyc_records RENAME COLUMN sumsub_applicant_id TO provider_reference;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;

    -- Rename reject_reason to rejection_reason
    BEGIN
        ALTER TABLE public.kyc_records RENAME COLUMN reject_reason TO rejection_reason;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;

    -- Rename submitted_at to created_at
    BEGIN
        ALTER TABLE public.kyc_records RENAME COLUMN submitted_at TO created_at;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
END$$;

ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'sumsub';

-- 3b. Ensure user_id has a unique constraint to support ON CONFLICT (user_id) upserts
ALTER TABLE public.kyc_records DROP CONSTRAINT IF EXISTS kyc_records_user_id_unique;
ALTER TABLE public.kyc_records DROP CONSTRAINT IF EXISTS kyc_records_user_id_unique;
ALTER TABLE public.kyc_records ADD CONSTRAINT kyc_records_user_id_unique UNIQUE (user_id);

-- 4. Enable RLS
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
DROP POLICY IF EXISTS "Allow select for kyc_records" ON public.kyc_records;
DROP POLICY IF EXISTS "Allow select for kyc_records" ON public.kyc_records;
CREATE POLICY "Allow select for kyc_records" ON public.kyc_records
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert/update for kyc_records" ON public.kyc_records;
DROP POLICY IF EXISTS "Allow insert/update for kyc_records" ON public.kyc_records;
CREATE POLICY "Allow insert/update for kyc_records" ON public.kyc_records
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 6. Update public.profiles table to hold crypto wallet IDs
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS crypto_wallet_ids UUID[] DEFAULT '{}'::UUID[];

-- 7. Setup Storage Bucket kyc-documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage policies for kyc-documents bucket
DROP POLICY IF EXISTS "Allow public read access to kyc-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to kyc-documents" ON storage.objects;

DROP POLICY IF EXISTS "Allow public read access to kyc-documents" ON storage.objects;
CREATE POLICY "Allow public read access to kyc-documents" ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents');

DROP POLICY IF EXISTS "Allow authenticated upload to kyc-documents" ON storage.objects;
CREATE POLICY "Allow authenticated upload to kyc-documents" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);


-- ========================================================
-- MIGRATION: 20260808000000_fix_admin_dashboard.sql
-- ========================================================

-- Add verification_status column to profiles if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified';

-- Add service_role bypass policies so admin dashboard can read all data
-- profiles
DROP POLICY IF EXISTS "service_role full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "service_role full access profiles" ON public.profiles;
CREATE POLICY "service_role full access profiles" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- kyc
DROP POLICY IF EXISTS "service_role full access kyc" ON public.kyc;
DROP POLICY IF EXISTS "service_role full access kyc" ON public.kyc;
CREATE POLICY "service_role full access kyc" ON public.kyc
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- fiat_wallets
DROP POLICY IF EXISTS "service_role full access fiat_wallets" ON public.fiat_wallets;
DROP POLICY IF EXISTS "service_role full access fiat_wallets" ON public.fiat_wallets;
CREATE POLICY "service_role full access fiat_wallets" ON public.fiat_wallets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- crypto_wallets
DROP POLICY IF EXISTS "service_role full access crypto_wallets" ON public.crypto_wallets;
DROP POLICY IF EXISTS "service_role full access crypto_wallets" ON public.crypto_wallets;
CREATE POLICY "service_role full access crypto_wallets" ON public.crypto_wallets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- transactions
DROP POLICY IF EXISTS "service_role full access transactions" ON public.transactions;
DROP POLICY IF EXISTS "service_role full access transactions" ON public.transactions;
CREATE POLICY "service_role full access transactions" ON public.transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- webhooks
DROP POLICY IF EXISTS "service_role full access webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "service_role full access webhooks" ON public.webhooks;
CREATE POLICY "service_role full access webhooks" ON public.webhooks
  FOR ALL TO service_role USING (true) WITH CHECK (true);


