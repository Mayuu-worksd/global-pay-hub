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
CREATE POLICY "Users can view their own record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Merchants can view their business profile" ON public.business_profiles FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY "Users can view their KYC records" ON public.kyc_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Merchants can view their API keys" ON public.merchant_api_keys FOR SELECT USING (auth.uid() = merchant_id);
