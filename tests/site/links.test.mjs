// Testes do site estático (offline, lendo os arquivos do repositório).
// Comando: node --test "tests/site/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const IGNORAR = new Set(['node_modules', '.git', 'tests', 'worker-contato', 'functions', '.wrangler', '.github']);

function paginas(dir = ROOT) {
  return readdirSync(dir).flatMap(nome => {
    if (IGNORAR.has(nome)) return [];
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return paginas(caminho);
    return nome.endsWith('.html') ? [caminho] : [];
  });
}

const HTML = paginas().map(f => ({ f, rel: relative(ROOT, f), html: readFileSync(f, 'utf8') }));

function destino(arquivo, href) {
  const [semHash] = href.split('#');
  const [caminho] = semHash.split('?');
  if (!caminho) return arquivo;
  const alvo = caminho.startsWith('/') ? join(ROOT, caminho) : resolve(dirname(arquivo), caminho);
  return existsSync(alvo) && statSync(alvo).isDirectory() ? join(alvo, 'index.html') : alvo;
}

test('todo link e recurso interno aponta para um arquivo que existe', () => {
  const quebrados = [];
  for (const { f, rel, html } of HTML) {
    for (const [, attr] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(attr)) continue;
      if (rel === '404.html' && attr.startsWith('/')) { if (!existsSync(destino(f, attr))) quebrados.push(`${rel} → ${attr}`); continue; }
      if (!existsSync(destino(f, attr))) quebrados.push(`${rel} → ${attr}`);
    }
  }
  assert.deepEqual(quebrados, []);
});

test('âncoras internas (#id) existem na página de destino', () => {
  const faltando = [];
  for (const { f, rel, html } of HTML) {
    for (const [, attr] of html.matchAll(/\shref="([^"]*#[^"]+)"/g)) {
      if (/^https?:/.test(attr)) continue;
      const [, id] = attr.split('#');
      const alvo = attr.startsWith('#') ? f : destino(f, attr);
      if (!existsSync(alvo)) continue;
      if (!readFileSync(alvo, 'utf8').includes(`id="${id}"`)) faltando.push(`${rel} → ${attr}`);
    }
  }
  assert.deepEqual(faltando, []);
});

test('links que abrem nova aba usam rel="noopener"', () => {
  const ruins = [];
  for (const { rel, html } of HTML) {
    for (const [tag] of html.matchAll(/<a\s[^>]*target="_blank"[^>]*>/g)) {
      if (!/rel="[^"]*noopener/.test(tag)) ruins.push(`${rel}: ${tag.slice(0, 80)}`);
    }
  }
  assert.deepEqual(ruins, []);
});

test('nenhum uso de innerHTML, eval ou document.write no JavaScript', () => {
  const js = readFileSync(join(ROOT, 'script.js'), 'utf8');
  assert.doesNotMatch(js, /\.innerHTML\s*=|\beval\(|new Function\(|document\.write/);
});

test('toda página indexável tem title, description e canonical', () => {
  for (const { rel, html } of HTML) {
    if (/name="robots" content="noindex"/.test(html)) continue;
    assert.match(html, /<title>[^<]{10,}<\/title>/, `${rel}: title`);
    assert.match(html, /name="description" content="[^"]{50,}"/, `${rel}: description`);
    assert.match(html, /rel="canonical" href="https:\/\/rutorin\.com\//, `${rel}: canonical`);
  }
});

test('páginas com versão em outro idioma apontam uma para a outra (hreflang)', () => {
  for (const { rel, html } of HTML) {
    const alternativos = [...html.matchAll(/hreflang="(pt|en)" href="https:\/\/rutorin\.com(\/[^"]*)"/g)];
    if (!alternativos.length) continue;
    for (const [, , caminho] of alternativos) {
      assert.ok(existsSync(join(ROOT, caminho, 'index.html')), `${rel}: hreflang para ${caminho} sem página`);
    }
  }
});

test('nenhum segredo ou e-mail pessoal publicado nos arquivos do site', () => {
  for (const { rel, html } of HTML) {
    assert.doesNotMatch(html, /@yahoo\.com|api[_-]?key|secret=|token=/i, rel);
  }
});

test('o formulário aponta para /api/contato nas duas línguas', () => {
  for (const pagina of ['index.html', 'en/index.html']) {
    const html = readFileSync(join(ROOT, pagina), 'utf8');
    assert.match(html, /data-endpoint="\/api\/contato"/, pagina);
    assert.match(html, /name="site"[^>]*tabindex="-1"/, `${pagina}: campo-armadilha`);
  }
});

test('preços da página inicial batem com os do catálogo de serviços', () => {
  const precos = html => Object.fromEntries([...html.matchAll(/<h3>([^<]+)<\/h3>\s*<p class="(?:price|svc-desc)">[\s\S]*?<strong>([^<]+)<\/strong>/g)].map(m => [m[1].trim(), m[2].trim()]));
  for (const [home, catalogo] of [['index.html', 'servicos/index.html'], ['en/index.html', 'en/services/index.html']]) {
    const naHome = precos(readFileSync(join(ROOT, home), 'utf8'));
    const noCatalogo = precos(readFileSync(join(ROOT, catalogo), 'utf8'));
    assert.ok(Object.keys(naHome).length >= 3, `${home}: pacotes não encontrados`);
    for (const [nome, preco] of Object.entries(naHome)) {
      assert.equal(noCatalogo[nome], preco, `${home} → ${nome}: ${preco} na home, ${noCatalogo[nome]} no catálogo`);
    }
  }
});
