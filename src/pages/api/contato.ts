import type { APIRoute } from 'astro';

// Rota sob demanda (Pages Function no Cloudflare), não pré-renderizada.
export const prerender = false;

interface Env {
  RESEND_API_KEY?: string;
  LEAD_TO?: string;
  RESEND_FROM?: string;
}

const esc = (s: string) =>
  String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

// Diagnóstico (temporário): mostra quais variáveis chegaram à função,
// sem expor os valores. Remover depois de confirmar o envio.
export const GET: APIRoute = async ({ locals }) => {
  const env = ((locals as any)?.runtime?.env ?? {}) as Env;
  return json({
    ok: true,
    config: {
      RESEND_API_KEY: !!env.RESEND_API_KEY,
      LEAD_TO: !!env.LEAD_TO,
      RESEND_FROM: !!env.RESEND_FROM,
    },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  // CSRF simples: rejeita POST vindo de outra origem.
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && !origin.endsWith(host)) return json({ ok: false, error: 'forbidden_origin' }, 403);

  let data: Record<string, string> = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      const fd = await request.formData();
      fd.forEach((v, k) => (data[k] = String(v)));
    }
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const nome = (data.nome || '').trim().slice(0, 200);
  const empresa = (data.empresa || '').trim().slice(0, 200);
  const email = (data.email || '').trim().slice(0, 200);
  const telefone = (data.telefone || '').trim().slice(0, 60);
  const mensagem = (data.mensagem || '').trim().slice(0, 5000);

  if (!nome || !empresa || !isEmail(email)) return json({ ok: false, error: 'campos_obrigatorios' }, 422);

  const env = ((locals as any)?.runtime?.env ?? {}) as Env;
  const apiKey = env.RESEND_API_KEY;
  const to = env.LEAD_TO;
  const from = env.RESEND_FROM || 'Norma Contábil <contato@normacontabil.com>';

  // Sem credenciais configuradas: não quebra o front, só não dispara.
  if (!apiKey || !to) {
    console.warn('[contato] RESEND_API_KEY/LEAD_TO ausentes — e-mail não enviado');
    return json({ ok: true, delivered: false });
  }

  const html = `<h2>Novo contato pelo site</h2>
    <p><strong>Nome:</strong> ${esc(nome)}</p>
    <p><strong>Empresa:</strong> ${esc(empresa)}</p>
    <p><strong>Email:</strong> ${esc(email)}</p>
    <p><strong>Telefone:</strong> ${esc(telefone) || '—'}</p>
    <p><strong>Mensagem:</strong><br>${esc(mensagem).replace(/\n/g, '<br>') || '—'}</p>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: `Contato do site — ${nome} (${empresa})`,
        html,
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
