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
