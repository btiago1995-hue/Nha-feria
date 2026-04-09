-- Add notify_on_invite preference to profiles
-- Controls whether a user receives email when invited to join a company
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_on_invite BOOLEAN NOT NULL DEFAULT true;
