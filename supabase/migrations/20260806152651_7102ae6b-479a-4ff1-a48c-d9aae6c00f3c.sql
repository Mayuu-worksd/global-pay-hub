CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
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
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TYPE public.kyc_status AS ENUM ('not_started','pending','approved','rejected');

CREATE TABLE public.kyc (
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
CREATE POLICY "own kyc" ON public.kyc FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER kyc_updated BEFORE UPDATE ON public.kyc FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.fiat_wallets (
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
CREATE POLICY "own fiat wallets" ON public.fiat_wallets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER fiat_wallets_updated BEFORE UPDATE ON public.fiat_wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.crypto_wallets (
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
CREATE POLICY "own crypto wallets" ON public.crypto_wallets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER crypto_wallets_updated BEFORE UPDATE ON public.crypto_wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.virtual_accounts (
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
CREATE POLICY "own virtual accounts" ON public.virtual_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER virtual_accounts_updated BEFORE UPDATE ON public.virtual_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TYPE public.transaction_type AS ENUM ('deposit','withdrawal','exchange','send','receive');
CREATE TYPE public.transaction_status AS ENUM ('pending','completed','failed','cancelled');

CREATE TABLE public.transactions (
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
CREATE POLICY "own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX transactions_user_created_idx ON public.transactions (user_id, created_at DESC);

CREATE TABLE public.beneficiaries (
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
CREATE POLICY "own beneficiaries" ON public.beneficiaries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER beneficiaries_updated BEFORE UPDATE ON public.beneficiaries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.transactions ADD CONSTRAINT transactions_beneficiary_fk FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiaries(id) ON DELETE SET NULL;

CREATE TABLE public.settings (
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
CREATE POLICY "own settings" ON public.settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
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

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();