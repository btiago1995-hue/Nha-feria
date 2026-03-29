import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── SISP / Vinti4 credentials (set in Supabase Edge Function secrets) ─────────
// SISP_POS_ID       — numeric POS identifier from SISP (e.g. "900512")
// SISP_POS_AUT_CODE — alphanumeric auth code from SISP (e.g. "123456789ssA")
// SISP_ENDPOINT     — payment endpoint (e.g. "https://mc.vinti4net.cv/payments")
const POS_ID       = Deno.env.get('SISP_POS_ID')       ?? 'PLACEHOLDER_POS_ID';
const POS_AUT_CODE = Deno.env.get('SISP_POS_AUT_CODE') ?? 'PLACEHOLDER_AUT_CODE';
const SISP_URL     = Deno.env.get('SISP_ENDPOINT')     ?? 'https://mc.vinti4net.cv/payments';
const APP_URL      = Deno.env.get('APP_URL')            ?? 'https://nhaferia.cv';

// ── Plan prices in CVE ────────────────────────────────────────────────────────
const PRICES: Record<string, Record<string, number>> = {
  pro:        { monthly: 3200,  annual: 34560  },
  enterprise: { monthly: 10900, annual: 117720 },
};

// ── Fingerprint (SHA-512 → Base64) ───────────────────────────────────────────
async function buildFingerprint(
  timestamp: string,
  amount: number,
  merchantRef: string,
  merchantSession: string,
): Promise<string> {
  const amountStr = String(amount * 1000); // CVE × 1000 as required by SISP
  const raw = POS_AUT_CODE + timestamp + amountStr + merchantRef + merchantSession +
              POS_ID + '132' + '1'; // currency=132 (CVE), transactionCode=1 (purchase)
  const msgUint8 = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

// ── Handler ───────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    // Auth: require a valid Supabase session
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return jsonError('Unauthorized', 401);
    }

    // Fetch admin profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'admin') {
      return jsonError('Only admins can initiate payments', 403);
    }

    // Parse request body
    const { plan, billingPeriod } = await req.json() as {
      plan: string;
      billingPeriod: 'monthly' | 'annual';
    };

    const amount = PRICES[plan]?.[billingPeriod];
    if (!amount) return jsonError('Invalid plan or billing period', 400);

    // Generate unique merchant reference (max 15 chars)
    const timestamp   = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const merchantRef = timestamp.slice(0, 12) + String(Math.floor(Math.random() * 999)).padStart(3, '0');
    const merchantSession = timestamp + String(Date.now()).slice(-6);

    // Fingerprint
    const fingerprint = await buildFingerprint(timestamp, amount, merchantRef, merchantSession);

    // Callback URL: the payments-callback Edge Function
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payments-callback`;

    // Store pending payment record
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await serviceClient.from('payments').insert({
      company_id:     profile.company_id,
      plan,
      billing_period: billingPeriod,
      amount,
      merchant_ref:   merchantRef,
      status:         'pending',
    });

    // Build the SISP form HTML
    const formHtml = buildSispForm({
      sispUrl: SISP_URL,
      posID: POS_ID,
      posAutCode: POS_AUT_CODE,
      merchantRef,
      merchantSession,
      amount,
      timestamp,
      fingerprint,
      callbackUrl,
    });

    return new Response(JSON.stringify({ formHtml, merchantRef }), {
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('payments-initiate error:', err);
    return jsonError('Internal error', 500);
  }
});

// ── Form builder ──────────────────────────────────────────────────────────────
function buildSispForm(p: {
  sispUrl: string;
  posID: string;
  posAutCode: string;
  merchantRef: string;
  merchantSession: string;
  amount: number;
  timestamp: string;
  fingerprint: string;
  callbackUrl: string;
}): string {
  const fields: Record<string, string> = {
    posID:               p.posID,
    posAutCode:          p.posAutCode,
    transactionCode:     '1',
    merchantRef:         p.merchantRef,
    merchantSession:     p.merchantSession,
    amount:              String(p.amount),
    currency:            '132',
    is3DSec:             '1',
    urlMerchantResponse: p.callbackUrl,
    languageMessages:    'pt',
    timeStamp:           p.timestamp,
    fingerprintType:     '0',
    fingerprint:         p.fingerprint,
  };
  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${escHtml(value)}">`)
    .join('\n');
  return `<form id="sispForm" method="POST" action="${escHtml(p.sispUrl)}">\n${inputs}\n</form>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
