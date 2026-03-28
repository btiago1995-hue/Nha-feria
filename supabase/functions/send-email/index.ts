// Supabase Edge Function: send-email
// Triggered by DB webhooks or called directly from the app.
// Uses Resend (https://resend.com) to send transactional emails.
//
// Required secret: RESEND_API_KEY
// Set via: supabase secrets set RESEND_API_KEY=re_xxxx
//
// Payload types:
//   { type: 'leave_submitted',  managerEmail, managerName, workerName, leaveType, startDate, endDate, dashboardUrl }
//   { type: 'leave_decided',    workerEmail,  workerName,  status,     leaveType, startDate, endDate, dashboardUrl }
//   { type: 'invite',           toEmail,      toName,      inviterName, companyName, inviteUrl }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM = 'Nha Féria <noreply@nhaferia.cv>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type } = payload;

    let to: string;
    let subject: string;
    let html: string;

    if (type === 'leave_submitted') {
      const { managerEmail, managerName, workerName, leaveType, startDate, endDate, dashboardUrl } = payload;
      to = managerEmail;
      subject = `Novo pedido de ${leaveType} — ${workerName}`;
      html = emailLeaveSubmitted({ managerName, workerName, leaveType, startDate, endDate, dashboardUrl });

    } else if (type === 'leave_decided') {
      const { workerEmail, workerName, status, leaveType, startDate, endDate, dashboardUrl } = payload;
      to = workerEmail;
      subject = status === 'approved'
        ? `O teu pedido de ${leaveType} foi aprovado ✓`
        : `O teu pedido de ${leaveType} não foi aprovado`;
      html = emailLeaveDecided({ workerName, status, leaveType, startDate, endDate, dashboardUrl });

    } else if (type === 'invite') {
      const { toEmail, toName, inviterName, companyName, inviteUrl } = payload;
      to = toEmail;
      subject = `${inviterName} convidou-te para a Nha Féria`;
      html = emailInvite({ toName, inviterName, companyName, inviteUrl });

    } else {
      return new Response(JSON.stringify({ error: 'Unknown email type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend error:', data);
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ── Email templates ─────────────────────────────────────────────────────────

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nha Féria</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#1A3A5C;padding:28px 32px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:#F59E0B;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;font-size:20px;">🌴</td>
              <td style="padding-left:10px;color:#fff;font-size:18px;font-weight:700;">Nha <span style="color:#F59E0B;">Féria</span></td>
            </tr></table>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
            <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
              Nha Féria · Gestão de Férias e Licenças em Cabo Verde<br/>
              <a href="https://nhaferia.cv" style="color:#94A3B8;">nhaferia.cv</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#1A3A5C;color:#fff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">${label}</a>`;
}

function emailLeaveSubmitted({ managerName, workerName, leaveType, startDate, endDate, dashboardUrl }: Record<string, string>): string {
  return base(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#1A3A5C;">Novo pedido de ausência</h2>
    <p style="margin:0 0 20px;color:#64748B;font-size:14px;">Olá${managerName ? ` ${managerName}` : ''},</p>
    <table width="100%" style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;" cellpadding="0" cellspacing="0">
      <tr style="background:#F8FAFC;"><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.05em;">Colaborador</td><td style="padding:12px 16px;font-size:14px;font-weight:600;color:#1E293B;">${workerName}</td></tr>
      <tr><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.05em;">Tipo</td><td style="padding:12px 16px;font-size:14px;color:#1E293B;text-transform:capitalize;">${leaveType}</td></tr>
      <tr style="background:#F8FAFC;"><td style="padding:12px 16px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.05em;">Período</td><td style="padding:12px 16px;font-size:14px;color:#1E293B;">${startDate} → ${endDate}</td></tr>
    </table>
    ${btn(dashboardUrl, 'Ver no dashboard →')}
  `);
}

function emailLeaveDecided({ workerName, status, leaveType, startDate, endDate, dashboardUrl }: Record<string, string>): string {
  const approved = status === 'approved';
  const color = approved ? '#059669' : '#DC2626';
  const icon = approved ? '✓' : '✗';
  const label = approved ? 'foi aprovado' : 'não foi aprovado';
  return base(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#1A3A5C;">O teu pedido de ${leaveType}</h2>
    <p style="margin:0 0 20px;color:#64748B;font-size:14px;">Olá${workerName ? ` ${workerName.split(' ')[0]}` : ''},</p>
    <div style="border-radius:10px;border:1px solid ${color}30;background:${color}08;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;font-size:16px;font-weight:700;color:${color};">${icon} O teu pedido ${label}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#64748B;">${startDate} → ${endDate}</p>
    </div>
    ${btn(dashboardUrl, 'Ver as minhas férias →')}
  `);
}

function emailInvite({ toName, inviterName, companyName, inviteUrl }: Record<string, string>): string {
  return base(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#1A3A5C;">Foste convidado!</h2>
    <p style="margin:0 0 20px;color:#64748B;font-size:14px;">Olá <strong>${toName}</strong>,</p>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
      <strong>${inviterName}</strong> convidou-te para gerir as tuas férias em <strong>${companyName}</strong> através da Nha Féria.
    </p>
    <p style="margin:0;color:#475569;font-size:14px;">Clica no botão abaixo para criar a tua conta. O convite expira em <strong>7 dias</strong>.</p>
    ${btn(inviteUrl, 'Criar conta →')}
    <p style="margin:20px 0 0;font-size:12px;color:#94A3B8;">Ou copia este link: <a href="${inviteUrl}" style="color:#2563EB;">${inviteUrl}</a></p>
  `);
}
