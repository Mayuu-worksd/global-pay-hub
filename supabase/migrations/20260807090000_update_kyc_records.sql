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
ALTER TABLE public.kyc_records ADD CONSTRAINT kyc_records_user_id_unique UNIQUE (user_id);

-- 4. Enable RLS
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
DROP POLICY IF EXISTS "Allow select for kyc_records" ON public.kyc_records;
CREATE POLICY "Allow select for kyc_records" ON public.kyc_records
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

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

CREATE POLICY "Allow public read access to kyc-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents');

CREATE POLICY "Allow authenticated upload to kyc-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);
