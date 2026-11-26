// Testes de unidade do formulário: função /api/contato + Worker rutorin-contato.
// Rodam offline, simulando a Cloudflare. Comando: node --test tests/unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { validate, buildEmail } from '../../worker-contato/src/index.js';
import { onRequestPost, onRequest } from '../../functions/api/contato.js';

const ORIGEM = 'https://rutorin.com';
const antigo = () => String(Date.now() - 20_000);

function ambiente({ falha = false, destino = 'teste@exemplo.com' } = {}) {
  const enviados = [];
  const env = {
    DESTINO: destino,
    EMAIL: {
      send: async m => {
        if (falha) { const e = new Error('falhou'); e.code = 'E_DELIVERY_FAILED'; throw e; }
        enviados.push(m);
        return { messageId: '1' };
      },
    },
  };
  // service binding simulado: o Pages chama o Worker
  const pagesEnv = { CONTATO: { fetch: (url, init) => worker.fetch(new Request(url, init), env) } };
  return { enviados, pagesEnv };
}

async function enviar(campos, { origem = ORIGEM, falha, destino, corpo, tipo = 'application/json' } = {}) {
  const { enviados, pagesEnv } = ambiente({ falha, destino });
  const headers = { 'content-type': tipo };
  if (origem) headers.origin = origem;
  const request = new Request('https://rutorin.com/api/contato', {
    method: 'POST', headers, body: corpo ?? JSON.stringify(campos),
  });
  const res = await onRequestPost({ request, env: pagesEnv });
  return { status: res.status, body: await res.json(), enviados };
}

const valido = { nome: 'Ana', email: 'ana@exemplo.com', classe: 'Dev indie', mensagem: 'Quero uma landing page.', site: '', _t: antigo(), idioma: 'pt', pagina: '/' };

test('envio válido manda 1 e-mail com Reply-To do visitante', async () => {
  const r = await enviar(valido);
  assert.equal(r.status, 200);
  assert.equal(r.enviados.length, 1);
  assert.equal(r.enviados[0].replyTo.email, 'ana@exemplo.com');
  assert.match(r.enviados[0].subject, /Novo contato \[PT\]/);
});

test('campos obrigatórios faltando → 422 sem enviar', async () => {
  const r = await enviar({ ...valido, nome: '', mensagem: '' });
  assert.equal(r.status, 422);
  assert.deepEqual(r.body.fields, ['nome', 'mensagem']);
  assert.equal(r.enviados.length, 0);
});

test('e-mail inválido → 422', async () => {
  const r = await enviar({ ...valido, email: 'nao-e-email' });
  assert.equal(r.status, 422);
});

test('injeção de cabeçalho no assunto é neutralizada', async () => {
  const r = await enviar({ ...valido, nome: 'Ana\r\nBcc: alvo@exemplo.com' });
  assert.equal(r.status, 200);
  assert.doesNotMatch(r.enviados[0].subject, /[\r\n]/);
});

test('armadilha anti-robô: finge sucesso e não envia', async () => {
  const r = await enviar({ ...valido, site: 'http://spam.example' });
  assert.equal(r.status, 200);
  assert.equal(r.enviados.length, 0);
});

test('envio instantâneo (robô) não envia', async () => {
  const r = await enviar({ ...valido, _t: String(Date.now()) });
  assert.equal(r.enviados.length, 0);
});

test('sem cabeçalho Origin → 403', async () => {
  const r = await enviar(valido, { origem: null });
  assert.equal(r.status, 403);
});

test('origem de outro site → 403', async () => {
  for (const origem of ['https://site-malicioso.com', 'https://outro.pages.dev', 'https://rutorin.com.evil.com', 'nao-e-url']) {
    const r = await enviar(valido, { origem });
    assert.equal(r.status, 403, origem);
  }
});

test('origens do próprio projeto são aceitas', async () => {
  for (const origem of ['https://rutorin.com', 'https://www.rutorin.com', 'https://rutorin-website.pages.dev', 'https://abc123.rutorin-website.pages.dev']) {
    const r = await enviar(valido, { origem });
    assert.equal(r.status, 200, origem);
  }
});

test('corpo grande demais → 413', async () => {
  const r = await enviar({ ...valido, mensagem: 'x'.repeat(40_000) });
  assert.equal(r.status, 413);
});

test('JSON inválido e formatos estranhos → 400', async () => {
  assert.equal((await enviar(null, { corpo: '{quebrado' })).status, 400);
  assert.equal((await enviar(null, { corpo: '[1,2,3]' })).status, 400);
  assert.equal((await enviar(null, { corpo: 'texto', tipo: 'text/plain' })).status, 400);
});

test('falha no envio → 502 com código do erro', async () => {
  const r = await enviar(valido, { falha: true });
  assert.equal(r.status, 502);
  assert.equal(r.body.code, 'E_DELIVERY_FAILED');
});

test('Worker sem segredo DESTINO → 500', async () => {
  const r = await enviar(valido, { destino: '' });
  assert.equal(r.status, 500);
});

test('métodos diferentes de POST → 405', async () => {
  assert.equal((await onRequest()).status, 405);
});

test('validate() corta campos longos', () => {
  const { data } = validate({ ...valido, nome: 'a'.repeat(500), mensagem: 'b'.repeat(9000) });
  assert.equal(data.nome.length, 120);
  assert.equal(data.mensagem.length, 5000);
});

test('buildEmail() gera e-mail em texto puro (sem HTML)', () => {
  const m = buildEmail({ nome: '<script>x</script>', email: 'a@b.co', classe: 'X', mensagem: '<b>oi</b>', idioma: 'pt', pagina: '/' }, { DESTINO: 'd@e.co' });
  assert.equal(m.html, undefined);
  assert.ok(m.text.includes('<b>oi</b>'));
});
