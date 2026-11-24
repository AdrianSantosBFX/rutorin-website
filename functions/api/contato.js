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

export async function onRequestPost({ request, env }) {
  // Aceita apenas envios feitos a partir do próprio site
  const origin = request.headers.get('origin');
  if (origin) {
    const host = new URL(origin).hostname;
    const allowed = host === 'rutorin.com' || host === 'www.rutorin.com' ||
      host === 'rutorin-website.pages.dev' || host.endsWith('.rutorin-website.pages.dev') || host === 'localhost';
    if (!allowed) return json({ ok: false, error: 'origin' }, 403);
  }

  if (!env.CONTATO) return json({ ok: false, error: 'binding' }, 500);

  let fields;
  try {
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      fields = await request.json();
    } else {
      fields = Object.fromEntries(await request.formData());
    }
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
