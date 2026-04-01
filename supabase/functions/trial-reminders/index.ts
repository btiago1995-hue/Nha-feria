// Supabase Edge Function: trial-reminders
// Called daily by pg_cron to send trial expiry emails.
//
// Sends:
//   - "trial_ending" when trial_ends_at is within the next 3 days (±12h window)
//   - "trial_expired" when trial_ends_at just passed in the last 24h
//
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEBHOOK_SECRET
// Schedule: daily at 09:00 UTC via pg_cron (see migration)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WEBHOOK_SECRET           = Deno.env.get('WEBHOOK_SECRET') ?? '';
const APP_URL                  = Deno.env.get('APP_URL') ?? 'https://nhaferia.cv';

serve(async (req) => {
  // Accept calls from pg_cron (no Origin) OR from internal webhooks
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();

  // ── 1. Find subscriptions ending in ~3 days (±12h window around the 3-day mark) ──
  const reminderStart = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000).toISOString();
  const reminderEnd   = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000).toISOString();

  // ── 2. Find subscriptions that just expired in the last 24h ──
  const expiredStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const expiredEnd   = now.toISOString();

  const [{ data: ending }, { data: expired }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('company_id, trial_ends_at, companies(name), profiles!inner(email, full_name, role)')
      .eq('status', 'trialing')
      .eq('profiles.role', 'admin')
      .gte('trial_ends_at', reminderStart)
      .lte('trial_ends_at', reminderEnd),
    supabase
      .from('subscriptions')
      .select('company_id, trial_ends_at, companies(name), profiles!inner(email, full_name, role)')
      .eq('status', 'trialing')
      .eq('profiles.role', 'admin')
      .gte('trial_ends_at', expiredStart)
      .lte('trial_ends_at', expiredEnd),
  ]);

  const results: { type: string; company: string; email: string; ok: boolean }[] = [];

  const sendEmail = async (payload: Record<string, string>) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  };

  const upgradeUrl = `${APP_URL}/upgrade`;

  // Send "trial ending in 3 days" emails
  for (const sub of (ending ?? [])) {
    const admin = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;
    const company = Array.isArray(sub.companies) ? sub.companies[0] : sub.companies;
    if (!admin?.email) continue;

    const trialEnd = new Date(sub.trial_ends_at);
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const ok = await sendEmail({
      type: 'trial_ending',
      adminEmail: admin.email,
      adminName: admin.full_name ?? '',
      companyName: company?.name ?? '',
      daysLeft: String(daysLeft),
      upgradeUrl,
    });
    results.push({ type: 'trial_ending', company: company?.name ?? sub.company_id, email: admin.email, ok });
  }

  // Send "trial expired" emails + update subscription status to past_due
  for (const sub of (expired ?? [])) {
    const admin = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;
    const company = Array.isArray(sub.companies) ? sub.companies[0] : sub.companies;
    if (!admin?.email) continue;

    const ok = await sendEmail({
      type: 'trial_expired',
      adminEmail: admin.email,
      adminName: admin.full_name ?? '',
      companyName: company?.name ?? '',
      upgradeUrl,
    });

    // Mark subscription as past_due so isSubscriptionActive = false in the app
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('company_id', sub.company_id);

    results.push({ type: 'trial_expired', company: company?.name ?? sub.company_id, email: admin.email, ok });
  }

  console.log('trial-reminders completed:', JSON.stringify(results));

  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
