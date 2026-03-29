import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const POS_AUT_CODE = Deno.env.get('SISP_POS_AUT_CODE') ?? 'PLACEHOLDER_AUT_CODE';
const APP_URL      = Deno.env.get('APP_URL')            ?? 'https://nhaferia.cv';

// ── Success messageType values from SISP ──────────────────────────────────────
const SUCCESS_TYPES = new Set(['8', '10', 'P', 'M']);

// ── Validate inbound fingerprint ──────────────────────────────────────────────
async function validateFingerprint(params: Record<string, string>): Promise<boolean> {
  const raw = POS_AUT_CODE +
    (params.messageType              ?? '') +
    (params.merchantRespCP           ?? '') +
    (params.merchantRespTid          ?? '') +
    (params.merchantRespMerchantRef  ?? '') +
    (params.merchantRespMerchantSession ?? '') +
    (params.merchantRespPurchaseAmt  ?? '') +
    (params.merchantRespMessageID    ?? '') +
    (params.merchantRespPan          ?? '') +
    (params.merchantResp             ?? '') +
    (params.merchantRespTimeStamp    ?? '') +
    (params.merchantRespReferenceNum ?? '') +
    (params.merchantRespEntityCode   ?? '') +
    (params.merchantRespClientReceipt ?? '') +
    (params.additionalErrorMessage   ?? '') +
    (params.reloadCode               ?? '');

  const msgUint8 = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
  const computed = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return computed === (params.fingerprint ?? '');
}

// ── Handler ───────────────────────────────────────────────────────────────────
serve(async (req) => {
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Parse form-urlencoded body from SISP
    const text = await req.text();
    const params = Object.fromEntries(new URLSearchParams(text).entries());

    const merchantRef  = params.merchantRespMerchantRef ?? '';
    const messageType  = params.messageType             ?? '';
    const userCancelled = params.UserCancelled === 'true';

    // Look up the pending payment
    const { data: payment } = await serviceClient
      .from('payments')
      .select('id, company_id, plan, billing_period, amount, subscription_id')
      .eq('merchant_ref', merchantRef)
      .eq('status', 'pending')
      .single();

    if (!payment) {
      // Unknown ref — redirect to generic failure
      return redirect(`${APP_URL}/payment/result?status=failed&reason=unknown`);
    }

    // User cancelled
    if (userCancelled) {
      await serviceClient.from('payments').update({
        status: 'cancelled',
        raw_response: params,
      }).eq('id', payment.id);
      return redirect(`${APP_URL}/payment/result?status=cancelled`);
    }

    // Validate fingerprint — MANDATORY, prevents fraud
    const fingerprintOk = await validateFingerprint(params);
    if (!fingerprintOk) {
      console.error('Fingerprint mismatch for merchantRef:', merchantRef);
      await serviceClient.from('payments').update({
        status: 'failed',
        error_description: 'Fingerprint mismatch',
        raw_response: params,
      }).eq('id', payment.id);
      return redirect(`${APP_URL}/payment/result?status=failed&reason=security`);
    }

    const isSuccess = SUCCESS_TYPES.has(messageType);

    if (isSuccess) {
      const sispTid       = params.merchantRespTid ?? null;
      const clearingPeriod = params.merchantRespCP ?? null;

      // Update or create subscription
      const now = new Date();
      const periodEnd = new Date(now);
      if (payment.billing_period === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Upsert subscription for this company
      const { data: sub } = await serviceClient
        .from('subscriptions')
        .upsert({
          company_id:           payment.company_id,
          plan:                 payment.plan,
          billing_period:       payment.billing_period,
          status:               'active',
          trial_ends_at:        null,
          current_period_start: now.toISOString(),
          current_period_end:   periodEnd.toISOString(),
        }, { onConflict: 'company_id' })
        .select('id')
        .single();

      // Also update the company's plan column
      await serviceClient
        .from('companies')
        .update({ plan: payment.plan })
        .eq('id', payment.company_id);

      // Mark payment as success
      await serviceClient.from('payments').update({
        status:              'success',
        sisp_transaction_id: sispTid,
        clearing_period:     clearingPeriod,
        subscription_id:     sub?.id ?? null,
        raw_response:        params,
      }).eq('id', payment.id);

      return redirect(`${APP_URL}/payment/result?status=success&plan=${payment.plan}`);
    } else {
      const errDesc = params.merchantRespErrorDescription ?? params.messageType ?? 'Payment declined';
      await serviceClient.from('payments').update({
        status:            'failed',
        error_description: errDesc,
        raw_response:      params,
      }).eq('id', payment.id);
      return redirect(`${APP_URL}/payment/result?status=failed&reason=declined`);
    }
  } catch (err) {
    console.error('payments-callback error:', err);
    return redirect(`${APP_URL}/payment/result?status=failed&reason=error`);
  }
});

function redirect(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url },
  });
}
