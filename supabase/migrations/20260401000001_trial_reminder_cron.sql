-- Schedule daily trial reminder emails via pg_cron + pg_net
-- Runs every day at 09:00 UTC
-- Calls the trial-reminders edge function which:
--   1. Sends "trial ending in 3 days" emails
--   2. Sends "trial expired" emails + marks subscription as past_due
--
-- SETUP REQUIRED (run once in Supabase SQL Editor):
--   ALTER DATABASE postgres SET app.settings.webhook_secret = 'your-webhook-secret-here';
--   Then run: SELECT pg_reload_conf();

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove previous schedule if it exists (idempotent re-runs)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'trial-reminders-daily') THEN
    PERFORM cron.unschedule('trial-reminders-daily');
  END IF;
END $$;

-- Schedule daily at 09:00 UTC
SELECT cron.schedule(
  'trial-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://hszqbofzwtgidowmzfmk.supabase.co/functions/v1/trial-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.webhook_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);
