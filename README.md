# Rutorin · rutorin.com

Site da **Rutorin**: sites, bots para Discord e Twitch e design sob medida para streamers, devs indie e criadores.
Inclui home de vendas em português e inglês, blog (devlog) e as políticas de privacidade e tratamento de dados.

🌐 **No ar:** https://rutorin.com

## Tecnologias

- HTML, CSS e JavaScript puros, sem frameworks e sem etapa de build
- Animações com a Web Animations API, nativa do navegador
- Hospedagem na Cloudflare Pages
- Formulário com Pages Functions + Cloudflare Workers (envio de e-mail nativo)

## Estrutura

```
index.html               Home em português (R$)
en/index.html            Home em inglês (US$)
blog/                    Devlog: listagem, posts, modelo de post e feed RSS
privacidade/             Política de Privacidade          (en/privacy/)
tratamento-de-dados/     Política de Tratamento de Dados  (en/data-processing/)
styles.css               Visual do site inteiro
script.js                Animações, idioma, menu, formulário e filtros do blog
assets/                  Imagens, fonte Fredoka e cursores
functions/api/contato.js Recebe o formulário (Cloudflare Pages Function)
worker-contato/          Worker que envia as mensagens por e-mail
_redirects               Esconde arquivos internos do site publicado
sitemap.xml, robots.txt  SEO
```

## Rodar localmente

Abra a pasta no VS Code e use a extensão **Live Server**, ou rode:

```bash
npx serve .
```

## Deploy

Cada `git push` na branch `main` publica o site automaticamente na Cloudflare Pages.

| Configuração        | Valor      |
|---------------------|------------|
| Framework           | Nenhum     |
| Comando de build    | *(vazio)*  |
| Pasta de saída      | `/`        |

## Documentação

O passo a passo completo (preços, idiomas, como publicar posts, Search Console, Analytics e LGPD) está no [LEIA-ME.md](LEIA-ME.md).

## Licença

© 2026 Rutorin. Todos os direitos reservados. O código, os textos, as ilustrações e a marca não podem ser copiados
ou reutilizados sem autorização. A fonte Fredoka segue a própria licença (`assets/Fredoka-LICENSE.txt`).
