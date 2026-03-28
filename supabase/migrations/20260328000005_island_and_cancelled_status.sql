-- Add island of residence to profiles (for local CV public holidays)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS island TEXT
CHECK (island IN ('Santiago','São Vicente','Santo Antão','Fogo','Sal','Boa Vista','Maio','São Nicolau','Brava','Santa Luzia'));

-- Add 'cancelled' status to leave requests (employee self-cancellation)
ALTER TABLE public.leave_requests
DROP CONSTRAINT IF EXISTS leave_requests_status_check;

ALTER TABLE public.leave_requests
ADD CONSTRAINT leave_requests_status_check
CHECK (status IN ('pending','approved','rejected','cancelled'));

-- Annual vacation balance reset function (scheduled via pg_cron)
CREATE OR REPLACE FUNCTION public.reset_annual_vacation_balances()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET vacation_balance = 22
  WHERE role = 'worker';
END;
$$;
