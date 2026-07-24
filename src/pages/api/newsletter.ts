import type { APIRoute } from 'astro';
import { isRateLimited } from '../../lib/rateLimit';

export const prerender = false;

interface Env {
  RESEND_API_KEY?: string;
  LEAD_TO?: string;
  RESEND_FROM?: string;
  RATE_LIMIT?: any;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const esc = (s: string) =>
  String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && !origin.endsWith(host)) return json({ ok: false, error: 'forbidden_origin' }, 403);

  const env = ((locals as any)?.runtime?.env ?? {}) as Env;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (await isRateLimited(env.RATE_LIMIT, ip, 'newsletter')) return json({ ok: false, error: 'rate_limited' }, 429);

  let email = '';
  let honeypot = '';
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      email = String(body['news-email'] || '');
      honeypot = String(body['empresa_url'] || '');
    } else {
      const fd = await request.formData();
      email = String(fd.get('news-email') || '');
      honeypot = String(fd.get('empresa_url') || '');
    }
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Honeypot: campo invisível que só um bot preencheria. Finge sucesso.
  if (honeypot.trim()) return json({ ok: true, delivered: true });

  email = email.trim().slice(0, 200);
  if (!isEmail(email)) return json({ ok: false, error: 'email_invalido' }, 422);

  const apiKey = env.RESEND_API_KEY;
  const to = env.LEAD_TO;
  const from = env.RESEND_FROM || 'Norma Contábil <contato@normacontabil.com>';

  if (!apiKey || !to) {
    console.warn('[newsletter] RESEND_API_KEY/LEAD_TO ausentes — não enviado');
    return json({ ok: true, delivered: false });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: 'Nova inscrição na newsletter',
        html: `<p>Novo inscrito na newsletter:</p><p><strong>${esc(email)}</strong></p>`,
        reply_to: email,
      }),
    });
    if (!r.ok) {
      console.error('[resend] falhou', r.status, await r.text().catch(() => ''));
      return json({ ok: false, error: 'envio_falhou' }, 502);
    }
  } catch (e: any) {
    console.error('[resend] erro', e?.message || e);
    return json({ ok: false, error: 'envio_erro' }, 502);
  }

  return json({ ok: true, delivered: true });
};
