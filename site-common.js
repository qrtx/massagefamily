(() => {
  const body = document.body;
  const theme = document.querySelector('#theme-toggle');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML = '<div class="loader-orbit"><span>✳</span><i></i></div><strong>massagefamily</strong><small>Елена Белова · массаж</small><div class="loader-progress"><i></i></div>';
  body.prepend(loader);
  body.classList.add('page-loading');
  window.setTimeout(() => body.classList.remove('page-loading'), prefersReduced ? 20 : 900);
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.pathname === location.pathname) return;
    event.preventDefault();
    body.classList.add('page-loading');
    window.setTimeout(() => location.assign(destination.href), prefersReduced ? 0 : 430);
  }, true);
  try { body.dataset.theme = localStorage.getItem('massagefamily-theme') || 'light'; } catch { body.dataset.theme = 'light'; }
  const setTheme = (value) => {
    body.dataset.theme = value;
    const dark = value === 'dark';
    theme?.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    theme?.setAttribute('aria-pressed', String(dark));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#071b12' : '#ecf4e9');
    try { localStorage.setItem('massagefamily-theme', value); } catch { /* storage can be unavailable */ }
  };
  setTheme(body.dataset.theme);
  theme?.addEventListener('click', () => setTheme(body.dataset.theme === 'dark' ? 'light' : 'dark'));
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'prices.html') document.title = 'Услуги и цены — massagefamily';
  const priceNav = document.querySelector('.floating-nav a[href$="prices.html"]');
  if (priceNav) {
    const icon = priceNav.querySelector('.nav-icon');
    const label = priceNav.querySelector('span:last-child');
    if (icon) icon.textContent = '✧';
    if (label) label.textContent = 'Услуги';
    priceNav.setAttribute('aria-label', 'Услуги и цены');
  }
  document.querySelectorAll('.nav-item').forEach((item) => {
    const active = item.getAttribute('href') === page;
    item.classList.toggle('current', active);
    if (active) item.setAttribute('aria-current', 'page');
  });
  const reveals = document.querySelectorAll('.reveal');
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, current) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); current.unobserve(entry.target); }
    }), { threshold: .1 });
    reveals.forEach((el) => observer.observe(el));
    document.documentElement.classList.add('js-motion');
  } else reveals.forEach((el) => el.classList.add('in-view'));
  document.querySelectorAll('.button, .nav-item, .theme-toggle, .admin-entry, .catalog-card').forEach((element) => {
    element.addEventListener('pointerdown', () => element.classList.add('pressed'));
    for (const event of ['pointerup','pointerleave','blur']) element.addEventListener(event, () => element.classList.remove('pressed'));
  });
  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  const footerMeta = document.querySelector('.site-footer > span');
  if (footerMeta) footerMeta.innerHTML = `© <span>${new Date().getFullYear()}</span> · Created by QRTX`;
  if (!document.body.classList.contains('admin-page')) {
    const headerRight = document.querySelector('.header-right');
    if (headerRight && !headerRight.querySelector('[data-admin-link]')) {
      const adminLink = document.createElement('a');
      adminLink.href = './admin.html';
      adminLink.className = 'admin-entry';
      adminLink.setAttribute('aria-label', 'Войти в админ-панель');
      adminLink.title = 'Вход в админ-панель';
      adminLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.4-3.8 2.7-5.8 7-5.8s6.6 2 7 5.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span>Админ</span>';
      adminLink.dataset.adminLink = 'true';
      headerRight.insertBefore(adminLink, theme);
    }
  }
  if (!document.body.classList.contains('admin-page') && document.querySelector('.price-list, #service-select')) {
    import('./prices-live.js').catch(() => {});
  }
  const progress = document.querySelector('.scroll-progress');
  let pending = false;
  window.addEventListener('scroll', () => {
    if (!progress || pending) return;
    pending = true;
    requestAnimationFrame(() => {
      const extent = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = `${extent > 0 ? scrollY / extent * 100 : 0}%`;
      pending = false;
    });
  }, { passive: true });
  const ambient = document.querySelector('.ambient-glow');
  if (ambient && !prefersReduced && matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      ambient.style.setProperty('--pointer-x', `${event.clientX}px`);
      ambient.style.setProperty('--pointer-y', `${event.clientY}px`);
    }, { passive: true });
  }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
