# Rutorin · site

Home de vendas da Rutorin, construída sobre o protótipo do Figma (mesma logo, cena, Fredoka, nuvens e padrão gamer).
HTML, CSS e JavaScript puros: sem build, sem dependências.

## Ver no computador

Abra a pasta no VS Code e use a extensão **Live Server** (botão "Go Live"), ou rode no terminal:

```
npx serve .
```

Abrir o `index.html` com dois cliques também funciona, mas o navegador bloqueia algumas fontes nesse modo.

## Arquivos

```
index.html     conteúdo e textos de todas as seções
styles.css     visual (cores no topo, em :root)
script.js      animações, menu do celular, formulário
assets/        imagens (WebP otimizado), fonte Fredoka e cursores
robots.txt     liberação para o Google
sitemap.xml    mapa do site para o Google
```

## Estrutura da home (o "jogo")

| Seção | Papel no funil |
|---|---|
| Hero · tela de título | Promessa, para quem é, CTA e garantias. É onde a venda acontece. |
| Fase 1 · Game over | O custo de deixar para depois (vende contra a inércia). |
| Fase 2 · Escolha sua classe | Streamer, dev indie ou portal: a pessoa se reconhece. |
| Fase 3 · Power-ups | Pacotes com preço "a partir de". |
| Fase 4 · A quest | Processo em 4 etapas: tira o medo de dor de cabeça. |
| Fase 5 · Save files | Prova: projetos e stack. |
| Fase 6 · Continue? | Garantias: o risco fica com você. |
| Fase 7 · Dicas do NPC | Perguntas frequentes (objeções). |
| Fase final · Player 2 | CTA final com formulário. |

## Antes de publicar: revise

1. **Preços** (procure por `R$` no `index.html`). Os valores atuais são sugestões.
2. **Promessas**: "resposta em até 24h", "poucas vagas por mês" e "ajustes incluídos" precisam ser verdade na prática.
3. **Formulário**: crie um formulário grátis no Formspree e cole o endereço em `data-endpoint=""` no `<form>`.
   Sem isso, o botão abre o app de e-mail do visitante com a mensagem pronta.
4. **E-mail**: crie `contato@rutorin.com` no Email Routing da Cloudflare, encaminhando para o seu Yahoo.
5. **Projetos**: textos de Skyward Legends e rutorin.com na Fase 5.

## Idiomas (português e inglês)

- `index.html` é a versão em **português** (reais); `en/index.html` é a versão em **inglês** (dólares).
- Ao abrir `rutorin.com`, um pequeno script no `<head>` olha os idiomas do navegador. Se nenhum for
  português (pt-BR, pt-PT, pt-AO, pt-MZ...), a pessoa vai direto para `rutorin.com/en/`, antes de a página aparecer.
- O botão 🌐 **PT/EN** no cabeçalho (e no menu do celular) troca de versão e **guarda a escolha** no navegador.
  Da próxima vez, vale a escolha da pessoa, não a detecção.
- Robôs de busca (Google, Bing etc.) não são redirecionados. As tags `hreflang` e o `sitemap.xml` dizem ao Google
  que as duas páginas são a mesma, em idiomas diferentes, e ele mostra a certa para cada país.
- Ao editar um texto, lembre de editar nos **dois** arquivos. Os preços em dólar (US$ 149, 390, 119) são sugestões.

## Blog

```
blog/index.html                  listagem com filtros (Devlog, Tutoriais, Bastidores)
blog/comecando-a-saga/index.html post de exemplo (edite ou apague)
blog/_modelo/index.html          modelo para posts novos (não aparece no Google)
blog/feed.xml                    feed RSS
```

**Publicar um post novo**

1. Copie a pasta `blog/_modelo` e renomeie com o endereço do post (minúsculas e hífens), ex.: `blog/primeiro-triangulo/`.
2. Troque todos os textos entre `[colchetes]`, inclusive os do `<head>` (título, descrição, endereço, data e categoria).
3. Apague a linha `<meta name="robots" content="noindex">`.
4. Em `blog/index.html`, copie o card do post de exemplo (`<article class="card post-card ...">`) e ajuste.
   Os cards com cadeado ("Fase bloqueada") podem ser apagados quando tiver posts suficientes.
5. Adicione um `<item>` em `blog/feed.xml` e uma `<url>` em `sitemap.xml`.

Imagens dos posts: coloque em `assets/blog/` e use `../../assets/blog/nome.webp` dentro do post.

## Google Search Console e Google Analytics

O site já está preparado: título e descrição em cada página, endereço canônico, `hreflang`, dados estruturados
(Blog, BlogPosting e Breadcrumb), `sitemap.xml`, `robots.txt` e feed RSS.

**Search Console** (depois que o site estiver no ar):
1. Em search.google.com/search-console, adicione uma propriedade do tipo **Domínio**: `rutorin.com`.
2. O Google mostra um registro TXT. Na Cloudflare, vá em **DNS → Registros → Adicionar**, tipo `TXT`, nome `@`,
   e cole o valor. Isso verifica o domínio inteiro (com e sem www, e todos os idiomas) sem mexer no código.
3. Em **Sitemaps**, envie `https://rutorin.com/sitemap.xml`.

**Google Analytics (GA4)**:
1. Crie a propriedade em analytics.google.com e copie o ID (`G-XXXXXXXXXX`).
2. Em cada página (`index.html`, `en/index.html` e os `index.html` dentro de `blog/`), procure o bloco
   comentado "Google Analytics", troque `G-XXXXXXXXXX` pelo seu ID e apague as linhas `<!--` e `-->` em volta.
3. **Atenção:** o Analytics usa cookies não essenciais. A Política de Privacidade promete pedir consentimento antes
   de ativá-los. Então, antes de ligar o GA4, é preciso um banner de cookies e atualizar a seção "Cookies" da política.
   Alternativa sem cookies e sem banner: **Cloudflare Web Analytics**, que já está descrito na política.

## Políticas (LGPD)

```
privacidade/            Política de Privacidade (PT)     en/privacy/           (EN)
tratamento-de-dados/    Política de Tratamento de Dados  en/data-processing/   (EN)
```

- **Privacidade:** dados de quem visita o site, entra em contato ou contrata (a Rutorin é a controladora).
- **Tratamento de Dados:** dados que passam pelos projetos dos clientes (o cliente é o controlador e a Rutorin, a operadora).
  Também serve como a política simplificada de segurança da informação. Vale citar esta página nas propostas e contratos.
- Os links estão no rodapé de todas as páginas, e há um aviso curto abaixo do botão do formulário.
- **Preencha os campos destacados em amarelo** (procure por `class="todo"`): seu nome, CNPJ (se tiver), a plataforma de
  pagamento e o provedor de hospedagem de bots. Quando terminar, apague `<mark class="todo">` e `</mark>` em volta do texto.
- Sempre que mudar algo nos serviços usados (novo formulário, Analytics, pagamento), atualize a política e a data no topo.
- Os textos são um ponto de partida bem fundamentado, mas não substituem a revisão de um advogado.

## Publicar na Cloudflare

1. Envie esta pasta para um repositório no GitHub.
2. Cloudflare → **Workers & Pages → Criar → Pages → Conectar ao Git**.
3. Framework: **Nenhum**. Comando de build: *(vazio)*. Pasta de saída: `/`.
4. Em **Domínios personalizados**, adicione `rutorin.com`.

Também dá para publicar sem GitHub: **Pages → Fazer upload de ativos** e arrastar a pasta.
