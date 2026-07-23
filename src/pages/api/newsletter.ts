import type { APIRoute } from 'astro';

export const prerender = false;

interface Env {
  RESEND_API_KEY?: string;
  LEAD_TO?: string;
  RESEND_FROM?: string;
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

  let email = '';
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      email = String((await request.json())['news-email'] || '');
    } else {
      email = String((await request.formData()).get('news-email') || '');
    }
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  email = email.trim().slice(0, 200);
  if (!isEmail(email)) return json({ ok: false, error: 'email_invalido' }, 422);

  const env = ((locals as any)?.runtime?.env ?? {}) as Env;
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
