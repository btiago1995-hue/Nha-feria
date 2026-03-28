import { supabase } from '../lib/supabase';

/**
 * Send a transactional email via the send-email Edge Function.
 * Silently ignores errors — emails are best-effort, never block the UX.
 */
export async function sendEmail(payload) {
  try {
    await supabase.functions.invoke('send-email', { body: payload });
  } catch (err) {
    // Non-critical — log but don't throw
    console.warn('sendEmail failed (non-critical):', err?.message);
  }
}
