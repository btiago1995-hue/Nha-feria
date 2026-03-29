-- Subscriptions: one active subscription per company
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id           UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan                 TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  billing_period       TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual')),
  status               TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled')),
  trial_ends_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  sisp_token           TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Payments: record of every payment attempt
CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id          UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  subscription_id     UUID REFERENCES public.subscriptions(id),
  plan                TEXT NOT NULL,
  billing_period      TEXT NOT NULL,
  amount              INTEGER NOT NULL,
  merchant_ref        TEXT UNIQUE NOT NULL,
  sisp_transaction_id TEXT,
  clearing_period     TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  error_description   TEXT,
  raw_response        JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at triggers
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their company subscription" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND company_id = subscriptions.company_id
    )
  );

CREATE POLICY "Admins can view their company payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND company_id = payments.company_id AND role = 'admin'
    )
  );
