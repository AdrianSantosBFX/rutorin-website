/* Chat ao vivo (tawk.to), carregado só quando o visitante clica no botão.
   Assim, nenhum script ou cookie do tawk.to roda antes de a pessoa pedir o chat,
   e a página continua leve para o Google.
   Para trocar de conta ou de widget, mude as duas constantes abaixo
   (no painel do tawk.to: Administration > Chat Widget > Widget Code). */
(() => {
  'use strict';

  const PROPERTY_ID = '6b0826a12cfcc03cfc828a1d';
  const WIDGET_ID = 'default';

  const isPt = (document.documentElement.lang || 'pt').toLowerCase().startsWith('pt');
  const t = isPt
    ? { label: 'Fale com a gente', loading: 'Abrindo o chat...', failed: 'O chat não abriu. Use o formulário de contato.' }
    : { label: 'Chat with us', loading: 'Opening chat...', failed: 'The chat did not open. Please use the contact form.' };

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chat-launcher';
  button.setAttribute('aria-label', t.label);

  const svgNS = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(svgNS, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6A.5.5 0 0 1 5 19.2V16h-.5A.5.5 0 0 1 4 15.5v-10Z');
  path.setAttribute('fill', 'currentColor');
  icon.appendChild(path);

  const text = document.createElement('span');
  text.textContent = t.label;
  button.append(icon, text);

  let started = false;

  function fail() {
    button.disabled = false;
    button.classList.remove('is-loading');
    text.textContent = t.failed;
    const contact = document.querySelector('#contato');
    if (contact) contact.scrollIntoView({ behavior: 'smooth' });
  }

  button.addEventListener('click', () => {
    if (started) return;
    started = true;
    button.disabled = true;
    button.classList.add('is-loading');
    text.textContent = t.loading;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    const timer = setTimeout(() => { started = false; fail(); }, 10000);
    window.Tawk_API.onLoad = () => {
      clearTimeout(timer);
      button.remove();
      if (typeof window.Tawk_API.maximize === 'function') window.Tawk_API.maximize();
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    script.addEventListener('error', () => { clearTimeout(timer); started = false; fail(); });
    document.body.appendChild(script);
  });

  document.body.appendChild(button);
})();
