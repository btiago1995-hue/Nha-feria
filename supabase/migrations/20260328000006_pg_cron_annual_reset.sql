-- Enable pg_cron and schedule annual vacation balance reset on Jan 1st
CREATE EXTENSION IF NOT EXISTS pg_cron;

GRANT USAGE ON SCHEMA cron TO postgres;

-- Reset vacation balances every January 1st at midnight UTC
SELECT cron.schedule(
  'annual-vacation-balance-reset',
  '0 0 1 1 *',
  $$SELECT public.reset_annual_vacation_balances()$$
);
