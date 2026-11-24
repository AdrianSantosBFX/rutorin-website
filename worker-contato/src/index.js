/**
 * rutorin-contato
 * Recebe as mensagens do formulário do site (repassadas pela função /api/contato)
 * e envia por e-mail para o endereço guardado no segredo DESTINO.
 *
 * Este Worker não tem endereço público: só a função do site consegue chamá-lo,
 * pelo "service binding" configurado no Cloudflare Pages.
 */

const LIMITS = { nome: 120, email: 200, classe: 60, mensagem: 5000 };
const MIN_SECONDS_ON_PAGE = 3; // robôs costumam enviar o formulário instantaneamente

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// Remove quebras de linha e espaços extras (evita injeção de cabeçalhos no assunto)
function oneLine(value) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

export function validate(fields, now = Date.now()) {
  // Armadilha para robôs: campo invisível que pessoas não preenchem
  if (fields.site) return { spam: true };

  // Tempo mínimo na página
  const started = Number(fields._t || 0);
  if (started && (now - started) / 1000 < MIN_SECONDS_ON_PAGE) return { spam: true };

  const data = {
    nome: oneLine(fields.nome).slice(0, LIMITS.nome),
    email: oneLine(fields.email).slice(0, LIMITS.email),
    classe: oneLine(fields.classe).slice(0, LIMITS.classe) || 'Não informado',
    mensagem: String(fields.mensagem || '').trim().slice(0, LIMITS.mensagem),
    idioma: fields.idioma === 'en' ? 'en' : 'pt',
    pagina: oneLine(fields.pagina).slice(0, 200),
  };

  const errors = [];
  if (!data.nome) errors.push('nome');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('email');
  if (data.mensagem.length < 5) errors.push('mensagem');
  return errors.length ? { errors } : { data };
}

export function buildEmail(data, env) {
  const flag = data.idioma === 'en' ? '🇺🇸 EN' : '🇧🇷 PT';
  return {
    to: env.DESTINO,
    from: { email: env.REMETENTE || 'site@rutorin.com', name: 'Site Rutorin' },
    replyTo: { email: data.email, name: data.nome },
    subject: oneLine(`Novo contato [${flag}] · ${data.classe} · ${data.nome}`).slice(0, 180),
    text: [
      'Nova mensagem pelo formulário de rutorin.com',
      '',
      `Nome:    ${data.nome}`,
      `E-mail:  ${data.email}`,
      `Classe:  ${data.classe}`,
      `Idioma:  ${flag}`,
      data.pagina ? `Página:  ${data.pagina}` : null,
      '',
      'Mensagem:',
      '----------------------------------------',
      data.mensagem,
      '----------------------------------------',
      '',
      'Responda este e-mail para falar direto com a pessoa.',
    ].filter(line => line !== null).join('\n'),
  };
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
    if (!env.DESTINO) return json({ ok: false, error: 'config' }, 500);

    let fields;
    try {
      fields = await request.json();
    } catch {
      return json({ ok: false, error: 'invalid' }, 400);
    }

    const result = validate(fields);
    // Para robôs, fingimos sucesso e não enviamos nada
    if (result.spam) return json({ ok: true });
    if (result.errors) return json({ ok: false, error: 'validation', fields: result.errors }, 422);

    try {
      await env.EMAIL.send(buildEmail(result.data, env));
      return json({ ok: true });
    } catch (error) {
      console.error('Falha ao enviar e-mail', error && error.code, error && error.message);
      return json({ ok: false, error: 'send' }, 502);
    }
  },
};
