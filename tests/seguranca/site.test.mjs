// Testes de segurança contra o site NO AR (padrão: https://rutorin.com).
// Não enviam e-mail: só usam entradas inválidas ou bloqueadas.
// Comando: node --test "tests/seguranca/*.test.mjs"   (outro endereço: defina BASE_URL=https://xxx.pages.dev)
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = (process.env.BASE_URL || 'https://rutorin.com').replace(/\/$/, '');
const get = (path, init = {}) => fetch(BASE + path, { redirect: 'manual', ...init });
const api = (body, headers = {}) => fetch(BASE + '/api/contato', {
  method: 'POST',
  redirect: 'manual',
  headers: { 'content-type': 'application/json', origin: BASE, ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('HTTPS: http:// redireciona para https://', async () => {
  if (!BASE.startsWith('https://')) return;
  const r = await fetch(BASE.replace('https://', 'http://') + '/', { redirect: 'manual' });
  assert.ok([301, 302, 307, 308].includes(r.status), `status ${r.status}`);
  assert.match(r.headers.get('location') || '', /^https:\/\//);
});

test('cabeçalhos de segurança presentes', async () => {
  const r = await get('/');
  const h = name => r.headers.get(name) || '';
  assert.match(h('strict-transport-security'), /max-age=\d{7,}/, 'HSTS');
  assert.equal(h('x-content-type-options'), 'nosniff');
  assert.ok(h('x-frame-options') === 'DENY' || /frame-ancestors 'none'/.test(h('content-security-policy')), 'proteção contra clickjacking');
  const csp = h('content-security-policy');
  assert.ok(csp, 'Content-Security-Policy');
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/, 'CSP não deve liberar scripts inline genéricos');
  assert.match(csp, /object-src 'none'/);
  assert.ok(h('referrer-policy'), 'Referrer-Policy');
});

test('CSP libera exatamente os scripts embutidos do HTML', async () => {
  const csp = (await get('/')).headers.get('content-security-policy') || '';
  for (const path of ['/', '/en/', '/blog/', '/privacidade/', '/servicos/', '/en/services/']) {
    const html = (await (await get(path)).text()).replace(/<!--[\s\S]*?-->/g, '');
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    for (const code of scripts) {
      const digest = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))).toString('base64');
      assert.ok(csp.includes(`'sha256-${digest}'`), `${path}: script embutido sem hash na CSP → 'sha256-${digest}'`);
    }
  }
});

test('arquivos internos não abrem pelo navegador', async () => {
  for (const path of ['/LEIA-ME.md', '/README.md', '/wrangler.jsonc', '/.gitignore', '/.gitattributes',
    '/worker-contato/src/index.js', '/worker-contato/wrangler.jsonc', '/functions/api/contato.js', '/tests/unit/contato.test.mjs']) {
    const r = await get(path);
    const corpo = r.status === 200 ? await r.text() : '';
    assert.ok(r.status !== 200 || corpo.trimStart().toLowerCase().startsWith('<!doctype html'), `${path} está exposto (status ${r.status})`);
  }
});

test('.git não está exposto', async () => {
  for (const path of ['/.git/HEAD', '/.git/config']) {
    const corpo = await (await get(path)).text();
    assert.doesNotMatch(corpo, /^ref: refs\/|\[core\]/m, path);
  }
});

test('página inexistente responde 404 de verdade', async () => {
  const r = await get('/pagina-que-nao-existe-' + Date.now());
  assert.equal(r.status, 404);
});

test('/api/contato: GET → 405', async () => {
  assert.equal((await get('/api/contato')).status, 405);
});

test('/api/contato: sem Origin → 403', async () => {
  const r = await fetch(BASE + '/api/contato', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 403);
});

test('/api/contato: Origin de outro site → 403', async () => {
  assert.equal((await api({}, { origin: 'https://site-malicioso.com' })).status, 403);
});

test('/api/contato: JSON inválido → 400', async () => {
  assert.equal((await api('{quebrado')).status, 400);
});

test('/api/contato: campos vazios → 422 sem detalhes internos', async () => {
  const r = await api({});
  assert.equal(r.status, 422);
  const texto = await r.text();
  assert.doesNotMatch(texto, /stack|at \w+ \(|DESTINO|yahoo/i);
});

test('/api/contato: tentativa de injeção é rejeitada (e-mail inválido)', async () => {
  const r = await api({ nome: 'A\r\nBcc: x@y.com', email: 'a\r\nbcc:x@y.com', mensagem: 'teste' });
  assert.equal(r.status, 422);
});

test('/api/contato: corpo de 100 KB → 413', async () => {
  const r = await api({ nome: 'a', email: 'x', mensagem: 'x'.repeat(100_000) });
  assert.equal(r.status, 413);
});

test('/api/contato: resposta não é guardada em cache', async () => {
  const r = await api({});
  assert.match(r.headers.get('cache-control') || '', /no-store/);
});

// Deixe este teste por último: ele dispara o bloqueio de 10 segundos para o IP de quem roda os testes.
test('/api/contato: limite de envios bloqueia rajadas (429)', async () => {
  if (!BASE.includes('rutorin.com')) return; // a regra existe só no domínio de produção
  const status = [];
  for (let i = 0; i < 6; i++) status.push((await api({})).status);
  assert.ok(status.includes(429), `nenhum bloqueio em 6 envios seguidos: ${status.join(', ')}`);
});
