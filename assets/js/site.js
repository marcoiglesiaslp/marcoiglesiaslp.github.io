(() => {
  'use strict';
  document.documentElement.classList.add('js-enabled');
  const header = document.querySelector('#header');
  const hero = document.querySelector('#hero');
  // Reveal the page once its initial visuals are ready, with a bounded wait.
  const coverUrl = getComputedStyle(hero, '::after').backgroundImage.slice(5, -2);
  const coverLoaded = performance.getEntriesByName(coverUrl).some(entry => entry.responseEnd > 0 && entry.decodedBodySize > 0);
  let coverReady = Promise.resolve();
  if (!coverLoaded) {
    const cover = new Image();
    cover.src = coverUrl;
    coverReady = cover.decode();
  }
  let readyDeadline;
  Promise.all([
    Promise.race([
      Promise.allSettled([coverReady, document.fonts.ready]),
      new Promise(resolve => { readyDeadline = setTimeout(resolve, 2200); }),
    ]),
    new Promise(resolve => setTimeout(resolve, 180)),
  ]).then(() => {
    clearTimeout(readyDeadline);
    clearTimeout(window.loaderFailsafe);
    document.documentElement.classList.remove('page-loading');
    document.querySelector('#page-loader')?.remove();
    window.dispatchEvent(new Event('site:ready'));
  });
  const nav = document.querySelector('#navbar');
  const menu = document.querySelector('.mobile-nav-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const back = document.querySelector('.back-to-top');
  const sectionHeadings = [...document.querySelectorAll('main .section-heading')];
  const floatingSupport = document.querySelector('.support-widget');
  const themeToggle = document.querySelector('.theme-toggle');
  function syncThemeButton() {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.setAttribute('aria-label', dark ? 'Activá el modo claro' : 'Activá el modo oscuro');
    themeToggle.title = dark ? 'Modo claro' : 'Modo oscuro';
    themeToggle.querySelector('i').className = dark ? 'bi bi-sun' : 'bi bi-moon-stars';
  }
  themeToggle.hidden = false;
  syncThemeButton();
  const faq = document.querySelector('#faq');
  const faqAnimations = new WeakMap();
  function animateFaq(event, opening) {
    const answer = event.target;
    if (!answer.id?.startsWith('faq-list-')) return;
    faqAnimations.get(answer)?.forEach(animation => animation.cancel());
    const animations = [...answer.querySelectorAll('p')].map(paragraph => paragraph.animate(
      opening
        ? [{ opacity: .15, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }]
        : [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-4px)' }],
      { duration: opening ? 500 : 320, delay: opening ? 80 : 0, fill: opening ? 'backwards' : 'forwards', easing: 'ease-out' },
    ));
    faqAnimations.set(answer, animations);
  }
  faq.addEventListener('show.bs.collapse', event => animateFaq(event, true));
  faq.addEventListener('hide.bs.collapse', event => animateFaq(event, false));
  faq.addEventListener('hidden.bs.collapse', event => {
    faqAnimations.get(event.target)?.forEach(animation => animation.cancel());
    faqAnimations.delete(event.target);
  });
  const coverageStates = new WeakMap();
  document.querySelectorAll('.coverage-more').forEach((details, index) => {
    const summary = details.querySelector('summary');
    const answer = details.querySelector('.coverage-answer');
    answer.id = `coverage-answer-${index}`;
    summary.setAttribute('aria-controls', answer.id);
    summary.setAttribute('aria-expanded', String(details.open));
    summary.addEventListener('click', event => {
      event.preventDefault();
      const previous = coverageStates.get(details);
      const open = !(previous?.open ?? details.open);
      const height = details.open ? answer.getBoundingClientRect().height : 0;
      previous?.animation.cancel();
      if (open) details.open = true;
      summary.setAttribute('aria-expanded', String(open));
      const animation = answer.animate([
        { height: `${height}px`, opacity: open ? .2 : 1 },
        { height: `${open ? answer.scrollHeight : 0}px`, opacity: open ? 1 : 0 },
      ], { duration: 480, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
      const state = { open, animation };
      coverageStates.set(details, state);
      animation.finished.then(() => {
        if (coverageStates.get(details) !== state) return;
        details.open = open;
        animation.cancel();
        coverageStates.delete(details);
      }).catch(() => {});
    });
  });
  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('marco-theme', theme); } catch {}
    syncThemeButton();
  });
  function setMenu(open) {
    nav.classList.toggle('navbar-mobile', open);
    document.documentElement.classList.toggle('mobile-menu-open', open);
    menu.classList.toggle('bi-list', !open);
    menu.classList.toggle('bi-x', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrá el menú' : 'Abrí el menú');
  }
  menu.hidden = false;
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('navbar-mobile')) { setMenu(false); menu.focus(); }
    if (event.key === 'Tab' && nav.classList.contains('navbar-mobile')) {
      const controls = [...nav.querySelectorAll('a,button')].filter(element => element.getClientRects().length && !element.hidden);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', event => {
    if (nav.classList.contains('navbar-mobile') && !nav.contains(event.target)) setMenu(false);
  });
  matchMedia('(min-width: 992px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  // Keep the same copy available through progressive disclosure on small screens.
  const compactViewport = matchMedia('(max-width: 767px)');
  const aboutStory = document.querySelector('.about-story');
  const planDescriptions = [...document.querySelectorAll('.plan-card')].map(card => ({
    description: card.querySelector('.card-text'),
    details: card.querySelector('.coverage-more'),
    answer: card.querySelector('.coverage-answer'),
  }));
  function syncCompactContent() {
    aboutStory.open = !compactViewport.matches;
    planDescriptions.forEach(({ description, details, answer }) => {
      if (compactViewport.matches) answer.prepend(description);
      else details.before(description);
    });
  }
  compactViewport.addEventListener('change', syncCompactContent);
  syncCompactContent();
  let navigationFrame;
  function cancelNavigation() {
    if (navigationFrame !== undefined) cancelAnimationFrame(navigationFrame);
    navigationFrame = undefined;
  }
  addEventListener('wheel', cancelNavigation, { passive: true });
  addEventListener('touchstart', cancelNavigation, { passive: true });
  addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Escape', ' '].includes(event.key)) cancelNavigation();
  });
  function navigateTo(target) {
    cancelNavigation();
    const start = scrollY;
    const destination = () => Math.max(0, target.getBoundingClientRect().top + scrollY - header.offsetHeight);
    // The owner explicitly requested animated anchor navigation, including on
    // devices reporting reduced motion. Decorative effects still respect it.
    const duration = Math.min(1800, 950 + Math.abs(destination() - start) * .18);
    const began = performance.now();
    function frame(now) {
      const time = Math.min(1, (now - began) / duration);
      const eased = (1 - Math.cos(Math.PI * time)) / 2;
      scrollTo({ top: start + (destination() - start) * eased, behavior: 'instant' });
      if (time < 1) navigationFrame = requestAnimationFrame(frame);
      else {
        navigationFrame = undefined;
        if (target.id === 'hero') { animateHeroCopy(); replayChat(); }
        const title = target.querySelector('.section-title .section-heading, .content h3, h2');
        if (!reduced.matches) title?.animate([{ opacity: .65, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 750, easing: 'cubic-bezier(.4,0,.2,1)' });
      }
    }
    navigationFrame = requestAnimationFrame(frame);
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const wasMobile = nav.classList.contains('navbar-mobile');
    setMenu(false);
    if (wasMobile) menu.focus();
    navigateTo(target);
    history.replaceState(null, '', `#${id}`);
  }));
  const sections = [...document.querySelectorAll('#navbar a[href^="#"]')].map(link => ({ link, section: document.getElementById(link.hash.slice(1)) })).filter(item => item.section);
  let scrollFrame;
  function onScroll() {
    scrollFrame = undefined;
    header.classList.toggle('header-scrolled', scrollY > 40);
    const pastHero = hero.getBoundingClientRect().bottom <= header.offsetHeight + 1;
    header.classList.toggle('header-dark', pastHero);
    floatingSupport?.classList.toggle('is-visible', pastHero);
    if (back) {
      const control = back.getBoundingClientRect();
      const coversHeading = sectionHeadings.some(heading => {
        const title = heading.getBoundingClientRect();
        return control.left < title.right + 4 && control.right > title.left - 4 && control.top < title.bottom + 4 && control.bottom > title.top - 4;
      });
      back.classList.toggle('active', scrollY > 500 && !coversHeading);
    }
    sections.forEach(({ link, section }) => {
      const active = scrollY + 180 >= section.offsetTop && scrollY + 180 < section.offsetTop + section.offsetHeight;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }
  addEventListener('scroll', () => { if (scrollFrame === undefined) scrollFrame = requestAnimationFrame(onScroll); }, { passive: true });
  addEventListener('resize', () => { if (scrollFrame === undefined) scrollFrame = requestAnimationFrame(onScroll); });
  onScroll();
  // Keep the legacy fade-up / zoom-in vocabulary with a quieter shared timing,
  // without nesting two reveal systems or loading the old navigation handlers.
  document.querySelectorAll('[data-reveal]').forEach(element => element.removeAttribute('data-reveal'));
  const revealTargets = new Map();
  function registerReveal(selector, effect = 'fade-up', delays = [0]) {
    document.querySelectorAll(selector).forEach((element, index) => {
      revealTargets.set(element, { effect, delay: delays[index % delays.length] });
    });
  }
  registerReveal('.section-title, #about .content, .contact .info-box, .contact-form');
  registerReveal('.service-intro');
  registerReveal('.trust-item', 'fade-up', [0, 100, 200, 300]);
  registerReveal('#about .video-box', 'zoom-in', [100]);
  registerReveal('#why-us .section-title', 'zoom-in');
  registerReveal('#why-us .box', 'fade-up', [0, 100, 200]);
  registerReveal('#services .icon-box', 'fade-up', [200, 300, 200, 300]);
  registerReveal('#about-boxes .row > div:has(.card)', 'fade-up', [100, 300, 200, 300, 300, 300]);
  registerReveal('.clients .container', 'zoom-in');
  registerReveal('.faq-list li', 'fade-up', [0, 100, 200, 300, 400]);
  revealTargets.delete(document.querySelector('#about .section-title'));
  revealTargets.delete(document.querySelector('#services .section-title'));
  function countExperience(element) {
    if (!element.matches('.trust-item')) return;
    const number = element.querySelector('strong');
    const finalText = number.textContent.trim();
    const target = Number.parseInt(finalText, 10);
    if (!Number.isFinite(target)) return;
    number.setAttribute('aria-label', finalText);
    const suffix = finalText.replace(/^\d+/, '');
    const started = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - started) / 1400);
      number.textContent = `${Math.round(target * (1 - (1 - progress) ** 3))}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
      else number.textContent = finalText;
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach(entry => {
        const element = entry.target;
        element.classList.add('is-entering');
        element.classList.remove('scroll-reveal-pending');
        element.classList.add('in-view');
        const smallScreen = matchMedia('(max-width: 767px)').matches;
        const zoom = element.dataset.revealEffect === 'zoom-in';
        const animation = element.animate([
          { opacity: 0, transform: zoom ? `scale(${smallScreen ? .98 : .96})` : `translateY(${smallScreen ? 16 : 24}px)` },
          { opacity: 1, transform: zoom ? 'scale(1)' : 'translateY(0)' },
        ], {
          duration: 750,
          delay: smallScreen ? 0 : Math.min(200, Number(element.dataset.scrollDelay) / 2),
          easing: 'cubic-bezier(.4,0,.2,1)',
          fill: 'backwards',
        });
        countExperience(element);
        animation.finished.then(() => {
          element.classList.remove('is-entering');
          element.dataset.scrollRevealed = 'true';
        }).catch(() => element.classList.remove('is-entering'));
        revealObserver.unobserve(element);
      });
    }, { threshold: .12, rootMargin: '0px 0px -35px 0px' });
    revealTargets.forEach(({ effect, delay }, element) => {
        element.dataset.scrollReveal = '';
        element.dataset.revealEffect = effect;
        element.dataset.scrollDelay = String(delay);
        if (element.getBoundingClientRect().top >= innerHeight - 35) {
          element.classList.add('scroll-reveal-pending');
          revealObserver.observe(element);
        } else element.dataset.scrollRevealed = 'true';
    });
  }
  let heroCopyAnimation;
  function animateHeroCopy() {
    heroCopyAnimation?.cancel();
    // The full message enters together, using the legacy template's fade-up.
    // Keep this requested entrance active on mobile and with reduced motion.
    heroCopyAnimation = document.querySelector('.hero-copy').animate([
      { opacity: 0, transform: 'translateY(16px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 750, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'backwards' });
  }
  window.addEventListener('site:ready', animateHeroCopy, { once: true });

  const logos = document.querySelector('.clients');
  const logoTrack = logos.querySelector('.logo-track');
  const copy = logos.querySelector('.logo-group').cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.dataset.logoCopy = '';
  copy.querySelectorAll('img').forEach(img => { img.alt = ''; img.loading = 'eager'; });
  logoTrack.append(copy);
  let logosVisible = true;
  function syncLogos() {
    // This section's animation was explicitly requested by the owner.
    logos.classList.add('logo-running');
    logos.dataset.paused = String(document.hidden || !logosVisible);
  }
  document.addEventListener('visibilitychange', syncLogos);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      logosVisible = entry.isIntersecting;
      syncLogos();
    }, { threshold: .15 });
    observer.observe(logos);
  }
  syncLogos();

  const chat = document.querySelector('.chat-preview');
  const chatMessages = [...chat.querySelectorAll('[data-chat-message]')];
  const chatMessageDuration = 520;
  const chatTyping = chat.querySelector('.chat-typing');
  const chatToggle = chat.querySelector('.chat-toggle');
  const chatPhone = chat.querySelector('.phone-device');
  const chatViewport = matchMedia('(min-width: 768px)');
  const chatScenarios = [
    { topic: 'auto', messages: [
      'Hola, quisiera asegurar mi auto.',
      'Hola, contanos la marca, el modelo y el año. Te ayudamos a buscar una cobertura.',
      '¿Qué opciones hay para mi auto?',
      'Lo vemos juntos y te explicamos qué cubre cada opción.',
    ] },
    { topic: 'hogar', messages: [
      'Hola, quiero asegurar mi casa.',
      '¡Hola! Contanos dónde está y qué querés proteger.',
      '¿También puedo cubrir mis cosas?',
      'Sí, podemos revisar opciones para la casa y su contenido.',
    ] },
    { topic: 'bicicleta', messages: [
      'Hola, ¿hay seguros para mi bici?',
      '¡Sí! Contanos qué bici tenés y cómo la usás.',
      'La uso para ir al trabajo.',
      'Veamos las opciones y qué cubre cada una.',
    ] },
    { topic: 'embarcación', messages: [
      'Hola, quiero asegurar mi lancha.',
      '¡Hola! Contanos el modelo y por dónde navegás.',
      '¿Podemos consultar por asistencia?',
      'Sí, revisamos la asistencia disponible y sus condiciones.',
    ] },
    { topic: 'viaje', messages: [
      'Hola, estoy por viajar en familia.',
      '¡Qué bueno! ¿A dónde viajan y por cuántos días?',
      '¿Qué opciones de cobertura hay?',
      'Contanos las fechas y el destino. Te orientamos.',
    ] },
    { topic: 'obra', messages: [
      'Hola, estoy por empezar una obra.',
      '¡Hola! Contanos qué vas a construir y dónde.',
      '¿Y para las personas que trabajan?',
      'Revisamos las opciones para la obra y el personal.',
    ] },
    { topic: 'comercio', messages: [
      'Hola, quiero asegurar mi local.',
      '¡Hola! ¿Qué actividad tenés y dónde está el local?',
      '¿Podemos revisar qué necesito cubrir?',
      'Claro. Contanos sobre tu negocio y vemos las opciones.',
    ] },
  ];
  let chatScenarioIndex = 0;
  let chatTimers = [];
  let dotAnimations = [];
  let chatPlayed = false;
  let chatVisible = false;
  let chatCollapsed = false;
  function stopChatTimers() {
    chatTimers.forEach(clearTimeout);
    chatTimers = [];
    dotAnimations.forEach(animation => animation.cancel());
    dotAnimations = [];
    chatTyping.classList.remove('is-visible');
  }
  function revealChatMessage(index) {
    dotAnimations.forEach(animation => animation.cancel());
    dotAnimations = [];
    chatTyping.classList.remove('is-visible');
    const message = chatMessages[index];
    message.classList.add('is-visible');
    message.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: chatMessageDuration, easing: 'cubic-bezier(.4,0,.2,1)' });
  }
  function showChatTyping(index) {
    chatTyping.style.top = `${chatMessages[index].offsetTop}px`;
    chatTyping.style.bottom = 'auto';
    chatTyping.classList.add('is-visible');
    dotAnimations = [...chatTyping.children].map((dot, index) => dot.animate([
      { opacity: .4, transform: 'translateY(0)' },
      { opacity: 1, transform: 'translateY(-3px)' },
      { opacity: .4, transform: 'translateY(0)' },
    ], { duration: 900, delay: index * 140, iterations: Infinity }));
  }
  function replayChat(advance = false) {
    if (chatCollapsed || !chatViewport.matches || document.hidden || document.documentElement.classList.contains('page-loading')) { finishChat(); return; }
    stopChatTimers();
    if (advance) chatScenarioIndex = (chatScenarioIndex + 1) % chatScenarios.length;
    const scenario = chatScenarios[chatScenarioIndex];
    chat.dataset.topic = scenario.topic;
    chat.setAttribute('aria-label', `Ejemplo ilustrativo de consulta sobre ${scenario.topic} con Marco Iglesias Seguros`);
    chatMessages.forEach((message, index) => { message.querySelector('p').textContent = scenario.messages[index]; });
    chatPlayed = true;
    chatMessages.forEach(message => message.classList.remove('is-visible'));
    const schedule = (fn, delay) => chatTimers.push(setTimeout(fn, delay));
    schedule(() => revealChatMessage(0), 750);
    schedule(() => showChatTyping(1), 1550);
    schedule(() => revealChatMessage(1), 2950);
    schedule(() => revealChatMessage(2), 4200);
    schedule(() => showChatTyping(3), 5050);
    schedule(() => revealChatMessage(3), 6500);
    // Keep five full seconds to read after the slower final bubble has entered.
    schedule(() => { if (chatVisible && !chatCollapsed && !document.hidden) replayChat(true); }, 6500 + chatMessageDuration + 5000);
  }
  function finishChat() {
    stopChatTimers();
    chatMessages.forEach(message => message.classList.add('is-visible'));
  }
  chat.classList.add('js-chat');
  chatToggle.hidden = false;
  chatToggle.addEventListener('click', () => {
    chatCollapsed = !chatCollapsed;
    chat.classList.toggle('is-collapsed', chatCollapsed);
    chatToggle.setAttribute('aria-expanded', String(!chatCollapsed));
    const label = chatCollapsed ? 'Mostrá el celular' : 'Ocultá el celular';
    chatToggle.setAttribute('aria-label', label);
    chatToggle.title = label;
    chatToggle.querySelector('i').className = chatCollapsed ? 'bi bi-chevron-left' : 'bi bi-chevron-right';
    chatPhone.inert = chatCollapsed;
    chatPhone.setAttribute('aria-hidden', String(chatCollapsed));
    if (chatCollapsed) finishChat();
    else if (chatVisible && !document.hidden) replayChat();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      chatVisible = entry.isIntersecting && chatViewport.matches;
      if (chatVisible && !document.hidden) replayChat();
      else if (chatPlayed) finishChat();
    }, { threshold: .25 });
    observer.observe(chat);
  } else { chatVisible = chatViewport.matches; if (chatVisible) replayChat(); }
  chatViewport.addEventListener('change', event => {
    const bounds = chat.getBoundingClientRect();
    chatVisible = event.matches && bounds.top < innerHeight && bounds.bottom > 0;
    if (chatVisible && !document.hidden) replayChat();
    else finishChat();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && chatPlayed) finishChat();
    else if (chatVisible) replayChat();
  });
  window.addEventListener('site:ready', () => { if (chatVisible) replayChat(); }, { once: true });

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
  const form = document.querySelector('.contact-form');
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('button[type="submit"]');
  const topics = new Set(['Seguros personales', 'Automotor', 'Hogar o comercio', 'Empresa u obra', 'Bicicletas o embarcaciones', 'Otra consulta']);
  const controls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
  form.addEventListener('input', event => {
    if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
    event.target.removeAttribute('aria-invalid');
  });
  function validateContact() {
    const limits = { name: [2, 120], email: [3, 254], subject: [1, 80], message: [10, 3000] };
    const values = {};
    for (const [name, [minimum, maximum]] of Object.entries(limits)) {
      const field = form.elements[name];
      const value = field.value.normalize('NFC').trim();
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
      let error = '';
      if (value.length < minimum) error = name === 'message' ? 'Escribí un mensaje de al menos 10 caracteres.' : 'Completá este campo.';
      else if (value.length > maximum) error = `Usá como máximo ${maximum} caracteres.`;
      else if (controls.test(value) || /[<>]/.test(value)) error = 'Usá solo texto, sin etiquetas HTML ni los signos < o >.';
      else if (name === 'name' && !/^[\p{L}\p{M}][\p{L}\p{M} .’'\-]*$/u.test(value)) error = 'Ingresá tu nombre usando letras, espacios, guiones o apóstrofes.';
      else if (name === 'subject' && !topics.has(value)) error = 'Elegí uno de los temas de la lista.';
      if (error) { field.setCustomValidity(error); field.setAttribute('aria-invalid', 'true'); }
      values[name] = value;
    }
    if (!form.reportValidity()) return null;
    // Only these text fields leave the page. There is no HTML rendering or SQL here.
    const payload = new FormData();
    Object.entries(values).forEach(([name, value]) => payload.append(name, value));
    payload.append('_gotcha', '');
    return payload;
  }
  let submitting = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    if (form.elements._gotcha.value) return;
    const payload = validateContact();
    if (!payload) return;
    submitting = true;
    submit.disabled = true;
    submit.textContent = 'Enviando consulta…';
    form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'loading';
    status.textContent = 'Estamos enviando tu mensaje.';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: payload,
        headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        const failure = new Error('El servicio no confirmó el envío.');
        if (response.status === 429) failure.publicMessage = 'El servicio de consultas alcanzó su límite temporal. Intentá más tarde o escribinos por WhatsApp.';
        else if ([404, 410].includes(response.status)) failure.publicMessage = 'El formulario no está disponible en este momento. Podés contactarnos por WhatsApp o email.';
        else if ([400, 422].includes(response.status)) failure.publicMessage = 'El servicio no aceptó los datos. Revisá tu email y el mensaje, o escribinos por WhatsApp.';
        else if (response.ok) failure.publicMessage = 'No pudimos confirmar el envío. Tus datos siguen acá. Podés reintentar o contactarnos por WhatsApp.';
        throw failure;
      }
      form.reset();
      status.dataset.state = 'success';
      status.textContent = 'Tu consulta se envió. Gracias por escribirnos; te responderemos al email que nos dejaste.';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.publicMessage || (error.name === 'AbortError'
        ? 'El envío tardó más de lo esperado y no pudimos confirmarlo. Tus datos siguen acá. Podés reintentar o escribirnos por WhatsApp.'
        : 'No pudimos enviar tu consulta. Tus datos siguen acá. Intentá nuevamente o escribinos por WhatsApp.');
    } finally {
      clearTimeout(timeout);
      submitting = false;
      submit.disabled = false;
      submit.textContent = 'Enviá tu consulta ↗';
      form.removeAttribute('aria-busy');
    }
  });
})();
