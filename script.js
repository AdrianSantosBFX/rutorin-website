/* Movimento e interações opcionais: todo o conteúdo funciona sem este arquivo. */
(() => {
  'use strict';

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const activeAnimations = new Set();
  const header = document.querySelector('.site-header');
  const commission = document.querySelector('.commission-button');
  const brand = document.querySelector('.brand');
  const easing = 'cubic-bezier(.22, 1, .36, 1)';

  // Textos do script nos dois idiomas
  const isPt = (document.documentElement.lang || 'pt').toLowerCase().startsWith('pt');
  const locale = isPt ? 'pt-BR' : 'en-US';
  const t = isPt ? {
    required: 'Preencha seu nome, um e-mail válido e sua ideia.',
    mailOpened: 'Abrimos seu app de e-mail com a mensagem pronta. É só enviar!',
    sending: 'Enviando...',
    sent: 'Mensagem enviada! Você recebe uma resposta em até 24h.',
    failed: email => `Não foi possível enviar agora. Escreva para ${email}.`,
    subject: cls => `Novo projeto · ${cls}`,
    body: d => `Nome: ${d.get('nome')}\nE-mail: ${d.get('email')}\nClasse: ${d.get('classe')}\n\n${d.get('mensagem')}`
  } : {
    required: 'Please fill in your name, a valid email and your idea.',
    mailOpened: 'We opened your email app with the message ready. Just hit send!',
    sending: 'Sending...',
    sent: 'Message sent! You will get a reply within 24h.',
    failed: email => `Could not send right now. Please write to ${email}.`,
    subject: cls => `New project · ${cls}`,
    body: d => `Name: ${d.get('nome')}\nEmail: ${d.get('email')}\nClass: ${d.get('classe')}\n\n${d.get('mensagem')}`
  };

  // Seletor de idioma: a escolha manual fica guardada e vence a detecção automática
  document.querySelectorAll('[data-lang-switch]').forEach(link => {
    link.addEventListener('click', () => {
      try { localStorage.setItem('rutorin-lang', link.dataset.langSwitch); } catch {}
    });
  });

  function animate(element, keyframes, options) {
    if (!element || motionPreference.matches || typeof element.animate !== 'function') return;
    const animation = element.animate(keyframes, options);
    activeAnimations.add(animation);
    animation.addEventListener('finish', () => activeAnimations.delete(animation), { once: true });
    if (document.hidden) animation.pause();
    return animation;
  }

  function enter(element, delay, distance = 18) {
    animate(element, [
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 720, delay, easing, fill: 'backwards' });
  }

  function startAmbientMotion() {
    document.querySelectorAll('.ambient-sparkles i').forEach((star, index) => {
      animate(star, [
        { opacity: 0, transform: 'translateY(7px) scale(.5)' },
        { opacity: .65, transform: 'translateY(0) scale(1)', offset: .45 },
        { opacity: 0, transform: 'translateY(-9px) scale(.55)' }
      ], { duration: 4300 + index * 390, delay: index * 910 + 700, iterations: Infinity, easing: 'ease-in-out' });
    });

    animate(document.querySelector('.cloud-divider'), [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-6px)' },
      { transform: 'translateY(0)' }
    ], { duration: 11000, iterations: Infinity, easing: 'ease-in-out' });

    animate(document.querySelector('.commission-sheen'), [
      { transform: 'translateX(0) skewX(-22deg)', opacity: 0, offset: 0 },
      { transform: 'translateX(0) skewX(-22deg)', opacity: 0, offset: .72 },
      { transform: 'translateX(0) skewX(-22deg)', opacity: .8, offset: .74 },
      { transform: 'translateX(390%) skewX(-22deg)', opacity: 0, offset: .94 },
      { transform: 'translateX(390%) skewX(-22deg)', opacity: 0, offset: 1 }
    ], { duration: 8200, delay: 1000, iterations: Infinity, easing: 'ease-in-out' });
  }

  // Entrada da tela de título
  [brand, document.querySelector('.desktop-nav'), commission, document.querySelector('.menu-button')]
    .forEach((element, index) => enter(element, index * 55, -10));
  enter(document.querySelector('.hero-eyebrow'), 120);
  document.querySelectorAll('h1 span').forEach((line, index) => enter(line, 180 + index * 100));
  enter(document.querySelector('.hero-sub'), 380);
  document.querySelectorAll('.hero-actions .button').forEach((button, index) => enter(button, 480 + index * 80));
  enter(document.querySelector('.hero-proof'), 660);
  startAmbientMotion();

  brand?.addEventListener('dragstart', event => event.preventDefault());

  // Cabeçalho ganha fundo sólido depois que o hero sai da tela
  const hero = document.querySelector('.world');
  if (header && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-solid', !entry.isIntersecting);
    }, { rootMargin: '-90px 0px 0px 0px' }).observe(hero);
  }

  // Seções aparecem ao rolar
  const revealItems = [...document.querySelectorAll('.reveal')];
  // Depois de aparecer, o elemento deixa de ser "reveal" para que o hover responda na hora.
  function settle(item) {
    item.classList.remove('reveal', 'is-visible');
    item.style.transitionDelay = '';
  }
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    revealItems.forEach(item => {
      const siblings = [...item.parentElement.children].filter(el => el.classList.contains('reveal'));
      item.dataset.stagger = String(Math.max(0, siblings.indexOf(item)) * 90);
    });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        const delay = Number(item.dataset.stagger || 0);
        item.style.transitionDelay = `${delay}ms`;
        item.classList.add('is-visible');
        setTimeout(() => settle(item), 760 + delay);
        revealObserver.unobserve(item);
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(settle);
  }

  // Executa algo uma única vez quando o elemento entra na tela
  function onVisible(element, callback, threshold = .35) {
    if (!element) return;
    if (!('IntersectionObserver' in window)) { callback(); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      callback();
    }, { threshold });
    observer.observe(element);
  }

  // Cards: brilho que segue o mouse (igual ao botão do cabeçalho) e leve inclinação 3D
  const tiltCards = new Set(document.querySelectorAll('.class-card, .package, .project-main'));
  document.querySelectorAll('.card').forEach(card => {
    let frame = 0;
    let event = null;
    card.addEventListener('pointermove', e => {
      if (motionPreference.matches || e.pointerType !== 'mouse') return;
      event = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty('--pointer-x', `${x * 100}%`);
        card.style.setProperty('--pointer-y', `${y * 100}%`);
        if (tiltCards.has(card)) {
          card.style.setProperty('--ry', `${(x - .5) * 6}deg`);
          card.style.setProperty('--rx', `${(.5 - y) * 6}deg`);
        }
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      frame = 0;
      ['--pointer-x', '--pointer-y', '--rx', '--ry'].forEach(p => card.style.removeProperty(p));
    });
  });

  // Fase 1: o jogador perde duas vidas quando o selo aparece
  onVisible(document.querySelector('#game-over .hud-chip'), () => {
    document.querySelectorAll('.lives .lost').forEach((heart, index) => {
      animate(heart, [
        { color: '#ff5d8f', transform: 'scale(1)' },
        { color: '#ff5d8f', transform: 'scale(1.5)', offset: .25 },
        { color: '#ffffff', transform: 'scale(.7)', offset: .45 },
        { color: '#ff5d8f', transform: 'scale(1.1)', offset: .6 },
        { color: '#3a4a8a', transform: 'scale(1)' }
      ], { duration: 900, delay: 400 + index * 450, easing: 'ease-out', fill: 'backwards' });
    });
  }, .8);

  // Fase 3: os preços sobem como um contador de pontos
  onVisible(document.querySelector('.packages'), () => {
    if (motionPreference.matches) return;
    document.querySelectorAll('.price strong').forEach((el, index) => {
      const final = el.textContent;
      const match = final.match(/^(\D*)([\d.,]+)/);
      if (!match) return;
      const prefix = match[1];
      const target = Number(match[2].replace(/\D/g, ''));
      if (!target) return;
      const format = n => prefix + n.toLocaleString(locale);
      const duration = 1100;
      const start = performance.now() + index * 120;
      el.textContent = format(0);
      const tick = now => {
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = t >= 1 ? final : format(Math.round(target * eased / 10) * 10);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, .3);

  // Selo "Mais completo" flutua de leve
  animate(document.querySelector('.package-badge'), [
    { transform: 'translateY(0)' },
    { transform: 'translateY(-4px)' },
    { transform: 'translateY(0)' }
  ], { duration: 2400, iterations: Infinity, easing: 'ease-in-out' });

  // Fase 4: o caminho da quest se desenha e os números pulam em sequência
  const questPath = document.querySelector('.quest-path');
  onVisible(questPath, () => {
    questPath.classList.add('is-drawn');
    questPath.querySelectorAll('.quest-node').forEach((node, index) => {
      animate(node, [
        { transform: 'scale(.4)', opacity: 0 },
        { transform: 'scale(1.15)', opacity: 1, offset: .6 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 520, delay: 250 + index * 260, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' });
    });
  }, .3);

  // Fase 5: o terminal "digita" linha por linha
  const terminalLines = document.querySelectorAll('.terminal .t-line');
  onVisible(document.querySelector('.terminal'), () => {
    terminalLines.forEach((line, index) => {
      animate(line, [
        { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        { opacity: 1, clipPath: 'inset(0 0 0 0)' }
      ], { duration: 380, delay: 300 + index * 330, easing: 'steps(14, end)', fill: 'backwards' });
    });
  }, .5);

  // Fase 6: ícones das garantias dão um pulinho ao passar o mouse
  document.querySelectorAll('.guarantee').forEach(item => {
    item.addEventListener('pointerenter', () => {
      animate(item.querySelector('.guarantee-icon svg'), [
        { transform: 'rotate(0) scale(1)' },
        { transform: 'rotate(-14deg) scale(1.15)', offset: .35 },
        { transform: 'rotate(8deg) scale(1.05)', offset: .7 },
        { transform: 'rotate(0) scale(1)' }
      ], { duration: 520, easing: 'ease-out' });
    });
  });

  // Fase 7: as perguntas abrem e fecham com suavidade
  document.querySelectorAll('.faq details').forEach(details => {
    const summary = details.querySelector('summary');
    let running = null;
    summary.addEventListener('click', event => {
      if (motionPreference.matches || typeof details.animate !== 'function') return;
      event.preventDefault();
      running?.cancel();
      const startHeight = details.offsetHeight;
      const opening = !details.open;
      if (opening) details.open = true;
      const endHeight = opening ? details.scrollHeight : summary.offsetHeight + 4;
      running = details.animate(
        { height: [`${startHeight}px`, `${endHeight}px`] },
        { duration: 320, easing }
      );
      running.onfinish = () => {
        if (!opening) details.open = false;
        running = null;
      };
      running.oncancel = () => { running = null; };
    });
  });

  // Brilho que segue o mouse no botão do cabeçalho
  let glowFrame = 0;
  let pointerX = 50;
  let pointerY = 50;
  commission?.addEventListener('pointermove', event => {
    if (motionPreference.matches || event.pointerType !== 'mouse') return;
    const rect = commission.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width * 100;
    pointerY = (event.clientY - rect.top) / rect.height * 100;
    if (glowFrame) return;
    glowFrame = requestAnimationFrame(() => {
      commission.style.setProperty('--pointer-x', `${pointerX}%`);
      commission.style.setProperty('--pointer-y', `${pointerY}%`);
      glowFrame = 0;
    });
  });
  commission?.addEventListener('pointerleave', () => {
    cancelAnimationFrame(glowFrame);
    glowFrame = 0;
    commission.style.removeProperty('--pointer-x');
    commission.style.removeProperty('--pointer-y');
  });

  // Menu do celular: abre com animação e fecha ao escolher um destino
  const mobileMenu = document.querySelector('#mobile-menu');
  mobileMenu?.addEventListener('toggle', event => {
    if (event.newState !== 'open') return;
    animate(mobileMenu, [
      { opacity: 0, transform: 'translateY(-8px) scale(.97)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ], { duration: 260, easing });
  });
  mobileMenu?.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenu.matches(':popover-open')) mobileMenu.hidePopover();
    });
  });

  // Formulário de contato
  const form = document.querySelector('.contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const formStartedAt = Date.now();
    const setStatus = (text, type) => {
      status.textContent = text;
      status.classList.toggle('is-error', type === 'error');
      status.classList.toggle('is-ok', type === 'ok');
    };

    form.addEventListener('submit', async event => {
      event.preventDefault();
      let firstInvalid = null;
      form.querySelectorAll('[required]').forEach(field => {
        const ok = field.checkValidity() && field.value.trim() !== '';
        field.setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        setStatus(t.required, 'error');
        firstInvalid.focus();
        return;
      }

      const data = new FormData(form);
      data.set('_t', String(formStartedAt));
      data.set('idioma', isPt ? 'pt' : 'en');
      data.set('pagina', location.pathname);
      const endpoint = form.dataset.endpoint;

      if (!endpoint) {
        window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(t.subject(data.get('classe')))}&body=${encodeURIComponent(t.body(data))}`;
        setStatus(t.mailOpened, 'ok');
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      setStatus(t.sending, '');
      try {
        const response = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(String(response.status));
        form.reset();
        setStatus(t.sent, 'ok');
      } catch {
        setStatus(t.failed(form.dataset.email), 'error');
      } finally {
        button.disabled = false;
      }
    });

    form.querySelectorAll('[required]').forEach(field => {
      field.addEventListener('input', () => field.removeAttribute('aria-invalid'));
    });
  }

  // Blog: filtro por categoria (as "fases bloqueadas" aparecem em todos os filtros)
  const filterButtons = document.querySelectorAll('.filter-chip');
  const postCards = document.querySelectorAll('.post-card');
  const emptyNote = document.querySelector('.blog-empty');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach(b => {
        const active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      let visible = 0;
      postCards.forEach(card => {
        const category = card.dataset.category;
        const show = filter === 'all' || category === filter || category === 'locked';
        card.hidden = !show;
        if (show && category !== 'locked') visible++;
        if (show) animate(card, [
          { opacity: 0, transform: 'translateY(14px) scale(.98)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], { duration: 380, easing });
      });
      if (emptyNote) emptyNote.hidden = visible > 0;
    });
  });

  // Blog: copiar link do post
  document.querySelectorAll('.copy-link').forEach(button => {
    button.addEventListener('click', async () => {
      const label = button.querySelector('span');
      try {
        await navigator.clipboard.writeText(button.dataset.url || location.href);
        label.textContent = isPt ? 'Link copiado!' : 'Link copied!';
      } catch {
        label.textContent = isPt ? 'Não deu para copiar' : 'Could not copy';
      }
      setTimeout(() => { label.textContent = isPt ? 'Copiar link' : 'Copy link'; }, 2200);
    });
  });

  // Ano no rodapé
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Brilho circular no clique
  const clickEffects = document.createElement('div');
  clickEffects.className = 'click-effects';
  clickEffects.setAttribute('aria-hidden', 'true');
  clickEffects.setAttribute('popover', 'manual');
  document.body.append(clickEffects);

  function removeRipple(ripple) {
    ripple.remove();
    if (!clickEffects.childElementCount && clickEffects.matches(':popover-open')) clickEffects.hidePopover();
  }

  document.addEventListener('click', event => {
    if (motionPreference.matches || event.button !== 0 || event.detail === 0) return;
    const { clientX, clientY } = event;
    requestAnimationFrame(() => {
      if (motionPreference.matches) return;
      if (typeof clickEffects.showPopover === 'function') {
        if (clickEffects.matches(':popover-open')) clickEffects.hidePopover();
        clickEffects.showPopover();
      }
      while (clickEffects.childElementCount >= 8) clickEffects.firstElementChild.remove();
      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      ripple.style.left = `${clientX - 34}px`;
      ripple.style.top = `${clientY - 34}px`;
      clickEffects.append(ripple);
      const animation = animate(ripple, [
        { opacity: .95, transform: 'scale(.15)' },
        { opacity: .65, transform: 'scale(.85)', offset: .35 },
        { opacity: 0, transform: 'scale(1.6)' }
      ], { duration: 760, easing: 'cubic-bezier(.16, .65, .3, 1)' });
      if (animation) animation.finished.then(() => removeRipple(ripple), () => removeRipple(ripple));
      else removeRipple(ripple);
    });
  }, { capture: true, passive: true });

  document.addEventListener('visibilitychange', () => {
    activeAnimations.forEach(animation => document.hidden ? animation.pause() : animation.play());
  });

  motionPreference.addEventListener('change', () => {
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
    if (!motionPreference.matches) startAmbientMotion();
  });
})();
