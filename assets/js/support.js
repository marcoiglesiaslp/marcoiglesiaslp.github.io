(() => {
  'use strict';
  const widget = document.querySelector('.support-widget');
  const launcher = widget.querySelector('.support-launcher');
  const panel = document.querySelector('#support-panel');
  const answers = panel.querySelector('#support-answers');
  const launchers = [...widget.querySelectorAll('.support-launcher')];
  const followup = widget.querySelector('.support-followup');
  const firstMessage = launcher.querySelector('strong').textContent;
  let audioContext;
  const soundedNotices = new Set();
  function enableNoticeAudio(event) {
    if (!event.isTrusted) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ??= new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch { /* Optional sound must not affect navigation or help. */ }
  }
  ['pointerdown','pointerup','keydown'].forEach(type => document.addEventListener(type,enableNoticeAudio,{passive:true}));
  widget.addEventListener('animationstart', event => {
    if (event.animationName !== 'support-notice-in' || ![widget,followup].includes(event.target)) return;
    if (document.hidden || !widget.classList.contains('is-visible') || widget.classList.contains('is-read') || widget.classList.contains('is-minimized')) return;
    if (audioContext?.state !== 'running' || soundedNotices.has(event.target)) return;
    try {
      const now = audioContext.currentTime;
      const tone = audioContext.createOscillator();
      const gain = audioContext.createGain();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(740,now);
      tone.frequency.exponentialRampToValueAtTime(420,now+.12);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(.045,now+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.15);
      tone.connect(gain);
      gain.connect(audioContext.destination);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
      tone.start(now);
      tone.stop(now+.16);
      soundedNotices.add(event.target);
    } catch { /* Continue silently when audio is unavailable. */ }
  });
  let followupTimer;
  function scheduleFollowup() {
    const eligible = widget.classList.contains('is-visible') && !document.hidden && !panel.open && !['is-read','is-minimized','has-followup'].some(name => widget.classList.contains(name));
    if (!eligible) { clearTimeout(followupTimer); followupTimer = undefined; return; }
    if (followupTimer !== undefined) return;
    followupTimer = setTimeout(() => {
      followupTimer = undefined;
      widget.classList.add('has-followup');
      followup.hidden = false;
      if (document.activeElement === launcher) followup.focus({preventScroll:true});
      launcher.inert = true;
      widget.querySelector('.support-badge').textContent = '2';
    },5000);
  }
  new MutationObserver(scheduleFollowup).observe(widget,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',scheduleFollowup);
  function restartNotices() {
    clearTimeout(followupTimer);
    followupTimer = undefined;
    const visible = widget.classList.contains('is-visible');
    widget.classList.remove('is-visible','is-read','is-minimized','has-followup');
    followup.hidden = true;
    launcher.inert = false;
    launcher.querySelector('strong').textContent = firstMessage;
    widget.querySelector('.support-badge').textContent = '1';
    soundedNotices.clear();
    // Commit the closed state so the first entrance and sound can replay.
    void widget.offsetWidth;
    if (visible) widget.classList.add('is-visible');
    scheduleFollowup();
  }
  const expansions = new WeakMap();
  function expand(details, expanded) {
    const previous = expansions.get(details);
    const startHeight = details.getBoundingClientRect().height;
    const wasOpen = details.open;
    const text = details.querySelector('p');
    const opacity = wasOpen ? getComputedStyle(text).opacity : '0';
    previous?.animation?.cancel();
    previous?.fade?.cancel();
    details.open = true;
    details.querySelector('summary').setAttribute('aria-expanded', String(expanded));
    const endHeight = expanded ? details.getBoundingClientRect().height : details.querySelector('summary').getBoundingClientRect().height + parseFloat(getComputedStyle(details).borderTopWidth);
    details.classList.add('is-animating');
    const animation = details.animate([{height:`${startHeight}px`},{height:`${endHeight}px`}], {duration:600,easing:'cubic-bezier(.4,0,.2,1)'});
    const fade = text.animate([{opacity},{opacity:expanded?1:0}], {duration:expanded?500:320,fill:'both',easing:'ease'});
    const state = {expanded,animation,fade};
    expansions.set(details,state);
    animation.finished.then(() => {
      if (expansions.get(details) !== state) return;
      details.open = expanded;
      details.classList.remove('is-animating');
      fade.cancel();
      state.animation = state.fade = null;
    }).catch(() => {});
  }
  // Reuse published FAQ text so the two help surfaces cannot drift apart.
  ['faq-list-2', 'faq-list-6', 'faq-list-3'].forEach(id => {
    const source = document.getElementById(id);
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const text = document.createElement('p');
    summary.textContent = source.previousElementSibling.textContent.replace(/\s+/g, ' ').trim();
    text.textContent = source.textContent.replace(/\s+/g, ' ').trim();
    text.id = `support-answer-${id}`;
    summary.setAttribute('aria-controls',text.id);
    summary.setAttribute('aria-expanded','false');
    details.append(summary, text);
    answers.append(details);
    summary.addEventListener('click', event => {
      event.preventDefault();
      const expanded = !(expansions.get(details)?.expanded ?? details.open);
      if (expanded) [...answers.children].forEach(other => {
        if (other !== details && (expansions.get(other)?.expanded ?? other.open)) expand(other,false);
      });
      expand(details,expanded);
    });
  });
  launchers.forEach(control => control.addEventListener('click', () => {
    launcher.inert = false;
    widget.classList.add('is-read');
    panel.showModal();
    document.documentElement.classList.add('support-open');
    launchers.forEach(button => button.setAttribute('aria-expanded', 'true'));
  }));
  function close() { panel.close(); }
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
  });
  panel.querySelector('.support-close').addEventListener('click', close);
  panel.addEventListener('click', event => {
    const rect = panel.getBoundingClientRect();
    if (event.target === panel && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
  });
  panel.addEventListener('close', () => {
    document.documentElement.classList.remove('support-open');
    launchers.forEach(button => button.setAttribute('aria-expanded', 'false'));
    restartNotices();
    if (widget.classList.contains('is-visible')) launcher.focus({ preventScroll: true });
  });
  panel.querySelector('.support-all-faq').addEventListener('click', event => {
    event.preventDefault();
    close();
    // Reuse the site's existing smooth navigation and section alignment.
    document.querySelector('#navbar a[href="#faq"]').click();
  });
  widget.querySelector('.support-dismiss').addEventListener('click', () => {
    launcher.inert = false;
    widget.classList.add('is-minimized');
    launcher.querySelector('strong').textContent = '¿Te ayudamos?';
    launcher.focus({ preventScroll: true });
  });
  widget.hidden = false;
  scheduleFollowup();
})();
