/**
 * POST /api/contato
 * Função do Cloudflare Pages: recebe o formulário do site e repassa ao Worker
 * "rutorin-contato" pelo service binding CONTATO, que envia o e-mail.
 */

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const MAX_BYTES = 32 * 1024; // nenhuma mensagem legítima passa disso

export async function onRequestPost({ request, env }) {
  // Aceita apenas envios feitos a partir do próprio site.
  // Navegadores sempre enviam Origin em POST; requisição sem Origin é de script/robô.
  const origin = request.headers.get('origin');
  if (!origin) return json({ ok: false, error: 'origin' }, 403);
  {
    let host = '';
    try { host = new URL(origin).hostname; } catch { return json({ ok: false, error: 'origin' }, 403); }
    const allowed = host === 'rutorin.com' || host === 'www.rutorin.com' ||
      host === 'rutorin-website.pages.dev' || host.endsWith('.rutorin-website.pages.dev') || host === 'localhost';
    if (!allowed) return json({ ok: false, error: 'origin' }, 403);
  }

  if (!env.CONTATO) return json({ ok: false, error: 'binding' }, 500);

  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) {
    return json({ ok: false, error: 'too_large' }, 413);
  }

  let fields;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BYTES) return json({ ok: false, error: 'too_large' }, 413);
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      fields = JSON.parse(raw);
    } else if (type.includes('multipart/form-data') || type.includes('application/x-www-form-urlencoded')) {
      fields = Object.fromEntries(await new Request(request.url, { method: 'POST', headers: { 'content-type': type }, body: raw }).formData());
    } else {
      return json({ ok: false, error: 'invalid' }, 400);
    }
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('shape');
  } catch {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  return env.CONTATO.fetch('https://rutorin-contato/enviar', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(fields),
  });
}

export function onRequest() {
  return json({ ok: false, error: 'method' }, 405);
}
