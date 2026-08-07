-- Add Unit and Currencycloud tracking columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_application_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currencycloud_account_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currencycloud_contact_id TEXT;
