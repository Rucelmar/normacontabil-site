// Rate limit simples por IP usando Cloudflare KV (best-effort, não atômico —
// suficiente para conter spam/flood nos formulários públicos).
const WINDOW_SECONDS = 600; // 10 min
const MAX_REQUESTS = 5;

export async function isRateLimited(kv: any, ip: string, route: string): Promise<boolean> {
  if (!kv) return false; // sem KV (ex.: dev local sem binding) — não bloqueia
  const key = `rl:${route}:${ip}`;
  const raw: string | null = await kv.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= MAX_REQUESTS) return true;
  await kv.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS });
  return false;
}
