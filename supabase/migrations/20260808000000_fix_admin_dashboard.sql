-- Add verification_status column to profiles if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified';

-- Add service_role bypass policies so admin dashboard can read all data
-- profiles
DROP POLICY IF EXISTS "service_role full access profiles" ON public.profiles;
CREATE POLICY "service_role full access profiles" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- kyc
DROP POLICY IF EXISTS "service_role full access kyc" ON public.kyc;
CREATE POLICY "service_role full access kyc" ON public.kyc
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- fiat_wallets
DROP POLICY IF EXISTS "service_role full access fiat_wallets" ON public.fiat_wallets;
CREATE POLICY "service_role full access fiat_wallets" ON public.fiat_wallets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- crypto_wallets
DROP POLICY IF EXISTS "service_role full access crypto_wallets" ON public.crypto_wallets;
CREATE POLICY "service_role full access crypto_wallets" ON public.crypto_wallets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- transactions
DROP POLICY IF EXISTS "service_role full access transactions" ON public.transactions;
CREATE POLICY "service_role full access transactions" ON public.transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- webhooks
DROP POLICY IF EXISTS "service_role full access webhooks" ON public.webhooks;
CREATE POLICY "service_role full access webhooks" ON public.webhooks
  FOR ALL TO service_role USING (true) WITH CHECK (true);
