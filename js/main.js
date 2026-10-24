/* JSPI enhancement layer. All educational content is available without JavaScript. */
(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');
  const email = 'jsp.initiative@gmail.com';
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.site-nav');
  const mobile = window.matchMedia('(max-width: 900px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const background = [document.querySelector('main'), document.querySelector('footer')];

  function setMenu(open, returnFocus = false) {
    navigation.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('menu-open', open);
    background.forEach(element => { if (element) element.inert = open; });
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { setMenu(false, true); return; }
    if (event.key === 'Tab') {
      const focusable = [...header.querySelectorAll('a, button')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target) && navigation.classList.contains('open')) setMenu(false);
  });
  mobile.addEventListener('change', () => setMenu(false));
  const updateHeader = () => header.classList.toggle('compact', window.scrollY > 45);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Progressive enhancement: without JS every domain section stays visible.
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const tablist = group.querySelector('[data-tablist]');
    const tabs = [...group.querySelectorAll('[data-tab]')];
    const panels = [...group.querySelectorAll('[data-panel]')];
    tablist.setAttribute('role', 'tablist');
    function activate(id, focus = false, updateUrl = false) {
      tabs.forEach(tab => {
        const active = tab.dataset.tab === id;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus();
      });
      panels.forEach(panel => { panel.hidden = panel.id !== id; });
      if (updateUrl) history.replaceState(null, '', '#' + id);
    }
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', tab.dataset.tab);
      const panel = panels.find(item => item.id === tab.dataset.tab);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      tab.addEventListener('click', () => activate(tab.dataset.tab, false, true));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); activate(tabs[next].dataset.tab, true, true); }
      });
    });
    const activateHash = () => {
      const id = location.hash.slice(1);
      if (panels.some(panel => panel.id === id)) activate(id);
    };
    activate(tabs[0].dataset.tab);
    activateHash();
    window.addEventListener('hashchange', activateHash);
  });

  // Avoid hiding content if observer support is unavailable or motion is reduced.
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.06 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    document.documentElement.classList.add('motion-ready');
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) document.documentElement.classList.remove('motion-ready');
    });
  }

  const copyEmail = document.querySelector('[data-copy-email]');
  if (copyEmail) copyEmail.addEventListener('click', async () => {
    const status = document.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(email);
      status.textContent = 'Email address copied.';
    } catch {
      const address = document.querySelector('.contact-address');
      const range = document.createRange();
      range.selectNodeContents(address);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      status.textContent = 'Address selected. Use your device’s copy command.';
    }
  });

  const form = document.querySelector('[data-contact-form]');
  if (form) {
    form.hidden = false;
    const status = form.querySelector('[data-form-status]');
    let draftBody = '';
    const fallback = document.createElement('div');
    fallback.className = 'contact-options';
    fallback.hidden = true;
    const draftLink = document.createElement('a');
    draftLink.className = 'text-link';
    draftLink.textContent = 'Open draft again';
    const copyDraft = document.createElement('button');
    copyDraft.type = 'button';
    copyDraft.className = 'copy-button';
    copyDraft.textContent = 'Copy message';
    fallback.append(draftLink, copyDraft);
    form.append(fallback);
    copyDraft.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(draftBody); status.textContent = 'Message copied. Paste it into an email to ' + email + '.'; }
      catch { status.textContent = 'Copy is unavailable here. Select your message above and email ' + email + '.'; }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const subject = 'JSPI — ' + values.get('interest');
      draftBody = 'Name: ' + values.get('name').trim() + '\nEmail: ' + values.get('email').trim() + '\nRole: ' + values.get('audience') + '\nInterest: ' + values.get('interest') + '\n\n' + values.get('message').trim();
      draftLink.href = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(draftBody);
      fallback.hidden = false;
      status.textContent = 'Draft prepared. Review and send it in your email app. If it does not open, copy your message and email ' + email + '.';
      window.location.href = draftLink.href;
    });
  }
})();
