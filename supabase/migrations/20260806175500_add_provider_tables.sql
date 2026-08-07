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

CREATE POLICY "Users can view their own wallet addresses" ON public.wallet_addresses FOR SELECT USING (auth.uid() = user_id);
-- provider_configs are internal metadata, disable public access
