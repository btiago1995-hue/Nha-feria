-- Root cause fix: company_id default was '00000000-0000-0000-0000-000000000000' (a fake
-- placeholder UUID). When handle_new_user fires, the profile gets this value. If
-- setup_company_admin() is never called (email confirmation flow, manual user creation),
-- the profile keeps pointing at a non-existent company, causing CompanyContext to return null.
--
-- Fix: default to NULL. A null company_id clearly means "not yet set up".
-- CompanyContext already handles this (early return if !profile.company_id).
-- Login.jsx now redirects to /setup-company when company_id is null.

ALTER TABLE public.profiles
  ALTER COLUMN company_id SET DEFAULT NULL;

-- Remove the stale placeholder company if it exists
DELETE FROM public.companies
  WHERE id = '00000000-0000-0000-0000-000000000000';
