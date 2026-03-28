-- company_invites: stores manager-generated invite tokens for onboarding new employees
CREATE TABLE IF NOT EXISTS public.company_invites (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token        UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  company_id   UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name    TEXT NOT NULL,
  role_label   TEXT,                        -- job title, e.g. "Designer"
  department   TEXT,
  vacation_balance INT DEFAULT 22,
  tenure_months    INT DEFAULT 0,
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  used_at      TIMESTAMPTZ,                 -- set when the invite is redeemed
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger not needed (invites are immutable after creation)

-- Enable RLS
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can read an invite by token (the token itself is the secret)
CREATE POLICY "Invite publicly readable"
  ON public.company_invites
  FOR SELECT
  USING (true);

-- Managers and admins can create invites
CREATE POLICY "Managers can create invites"
  ON public.company_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Authenticated users can mark an invite as used (redeem it)
CREATE POLICY "Authenticated can redeem invite"
  ON public.company_invites
  FOR UPDATE
  USING (auth.role() = 'authenticated' AND used_at IS NULL);

-- Managers can delete (revoke) invites for their company
CREATE POLICY "Managers can revoke invites"
  ON public.company_invites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND company_id = company_invites.company_id
        AND role IN ('manager', 'admin')
    )
  );
