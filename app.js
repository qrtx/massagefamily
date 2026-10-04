(() => {
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML = '<div class="loader-orbit"><span>✳</span><i></i></div><strong>massagefamily</strong><small>Елена Белова · массаж</small><div class="loader-progress"><i></i></div>';
  body.prepend(loader);
  body.classList.add('page-loading');
  window.setTimeout(() => body.classList.remove('page-loading'), reducedMotion ? 20 : 900);
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.pathname === location.pathname) return;
    event.preventDefault();
    body.classList.add('page-loading');
    window.setTimeout(() => location.assign(destination.href), reducedMotion ? 0 : 430);
  }, true);
  const footerMeta = document.querySelector('.site-footer > span');
  if (footerMeta) footerMeta.innerHTML = `© <span>${new Date().getFullYear()}</span> · Created by QRTX`;
  const headerRight = document.querySelector('.header-right');
  if (headerRight && !headerRight.querySelector('[data-admin-link]')) {
    const adminLink = document.createElement('a');
    adminLink.href = './admin.html';
    adminLink.className = 'admin-entry';
    adminLink.setAttribute('aria-label', 'Войти в админ-панель');
    adminLink.title = 'Вход в админ-панель';
    adminLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.4-3.8 2.7-5.8 7-5.8s6.6 2 7 5.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span>Админ</span>';
    adminLink.dataset.adminLink = 'true';
    headerRight.insertBefore(adminLink, document.querySelector('#theme-toggle'));
  }
  const grid = document.querySelector('#calendar-grid');
  const monthLabel = document.querySelector('#month-label');
  const slotsDate = document.querySelector('#slots-date');
  const slotsHint = document.querySelector('#slots-hint');
  const timeSlots = document.querySelector('#time-slots');
  const submit = document.querySelector('#booking-submit');
  const themeButton = document.querySelector('#theme-toggle');
  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const weekdays = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDay = null;
  let selectedTime = null;
  let toastTimer;
  let siteData;
  let siteDataModule;
  const localDataModule = import('./site-data.js').then((module) => {
    siteDataModule = module;
    siteData = module.readLocalData();
    renderCalendar();
    if (selectedDay) renderSlots(selectedDay);
  });

  function showToast(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 4300);
  }

  function applyTheme(theme, save = true) {
    body.dataset.theme = theme;
    const dark = theme === 'dark';
    themeButton.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    themeButton.setAttribute('aria-pressed', String(dark));
    document.querySelector('meta[name="theme-color"]').content = dark ? '#071b12' : '#ecf4e9';
    if (save) {
      try { localStorage.setItem('massagefamily-theme', theme); } catch { /* Storage may be disabled by the browser. */ }
    }
  }

  applyTheme(body.dataset.theme || 'light', false);
  themeButton.addEventListener('click', () => {
    const nextTheme = body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(nextTheme === 'dark' ? 'Включена тёмная тема' : 'Включена светлая тема');
  });

  function keyFor(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function scheduleFor(date) {
    if (siteDataModule && siteData) return siteDataModule.availableSlots(date, siteData);
    if (date.getDay() === 0) return [];
    const base = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    const seed = date.getDate() + date.getMonth() * 13 + date.getFullYear();
    return base.filter((_, index) => (seed + index * 3) % 5 !== 0);
  }

  function clearChoice() {
    selectedDay = null;
    selectedTime = null;
    submit.disabled = true;
    slotsDate.textContent = 'Выберите день';
    slotsHint.textContent = 'Свободные окна отображаются зелёным.';
    timeSlots.innerHTML = '<p class="empty-slots">Выберите дату в календаре, чтобы увидеть время.</p>';
  }

  function renderSlots(date) {
    selectedDay = date;
    selectedTime = null;
    submit.disabled = true;
    slotsDate.textContent = `${date.getDate()} ${monthNames[date.getMonth()].toLowerCase()}, ${weekdays[date.getDay()]}`;
    const available = scheduleFor(date);
    timeSlots.replaceChildren();
    if (available.length === 0) {
      slotsHint.textContent = 'В этот день свободных окон нет.';
      timeSlots.innerHTML = '<p class="empty-slots">Попробуйте выбрать другой день — буду рада подобрать время.</p>';
      return;
    }
    slotsHint.textContent = 'Выберите удобное время для запроса.';
    for (const time of ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00']) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `time-slot${available.includes(time) ? '' : ' busy'}`;
      button.textContent = time;
      button.setAttribute('aria-pressed', 'false');
      if (!available.includes(time)) {
        button.disabled = true;
        button.setAttribute('aria-label', `${time}, занято`);
      } else {
        button.setAttribute('aria-label', `${time}, свободно`);
        button.addEventListener('click', () => {
          timeSlots.querySelectorAll('.time-slot').forEach((slot) => {
            slot.classList.remove('selected');
            slot.setAttribute('aria-pressed', 'false');
          });
          button.classList.add('selected');
          button.setAttribute('aria-pressed', 'true');
          selectedTime = time;
          submit.disabled = false;
        });
      }
      timeSlots.append(button);
    }
  }

  function renderCalendar() {
    monthLabel.textContent = `${monthNames[month.getMonth()]} ${month.getFullYear()}`;
    grid.replaceChildren();
    const firstOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstOffset; i += 1) {
      const spacer = document.createElement('span');
      spacer.className = 'day-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      grid.append(spacer);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const available = scheduleFor(date);
      const past = date.getTime() < today.getTime();
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `day-cell ${available.length ? 'available' : 'busy'}`;
      button.textContent = String(day);
      button.setAttribute('aria-label', `${day} ${monthNames[month.getMonth()]}, ${past ? 'дата прошла' : available.length ? 'есть свободное время' : 'нет свободных окон'}`);
      button.setAttribute('aria-pressed', 'false');
      if (past || available.length === 0) {
        button.disabled = true;
      } else {
        button.addEventListener('click', () => {
          grid.querySelectorAll('.day-cell').forEach((cell) => {
            cell.classList.remove('selected');
            cell.setAttribute('aria-pressed', 'false');
          });
          button.classList.add('selected');
          button.setAttribute('aria-pressed', 'true');
          renderSlots(date);
        });
      }
      if (date.getTime() === today.getTime()) button.classList.add('today');
      if (selectedDay && keyFor(date) === keyFor(selectedDay)) {
        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
      }
      grid.append(button);
    }
  }

  document.querySelector('#prev-month').addEventListener('click', () => {
    const previous = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    if (previous < new Date(today.getFullYear(), today.getMonth(), 1)) return;
    month = previous;
    clearChoice();
    renderCalendar();
  });
  document.querySelector('#next-month').addEventListener('click', () => {
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    clearChoice();
    renderCalendar();
  });
  submit.addEventListener('click', () => {
    if (!selectedDay || !selectedTime) return;
    const dateText = `${selectedDay.getDate()} ${monthNames[selectedDay.getMonth()].toLowerCase()} ${selectedDay.getFullYear()}`;
    const message = `Здравствуйте, Елена! Хочу записаться на массаж ${dateText} в ${selectedTime}. Подтвердите, пожалуйста, доступность и актуальную стоимость.`;
    window.open(`https://t.me/elenabelova77?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });
  renderCalendar();
  localDataModule.then(() => import('./firebase-client.js')).then((firebase) => {
    firebase.onValue(firebase.databaseRef('siteData'), (snapshot) => {
      siteData = siteDataModule.mergeData(snapshot.val());
      siteDataModule.saveLocalData(siteData);
      const badge = document.querySelector('#calendar-data-status');
      if (badge) badge.textContent = snapshot.exists() ? 'Расписание обновляется онлайн' : 'Демо-расписание · база пока пустая';
      renderCalendar();
      if (selectedDay) renderSlots(selectedDay);
    }, () => {
      const badge = document.querySelector('#calendar-data-status');
      if (badge) badge.textContent = 'Локальное демо-расписание';
    });
  }).catch(() => {
    const badge = document.querySelector('#calendar-data-status');
    if (badge) badge.textContent = 'Локальное демо-расписание';
  });
  document.querySelector('#year').textContent = String(new Date().getFullYear());

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
    document.documentElement.classList.add('js-motion');
  } else {
    revealItems.forEach((item) => item.classList.add('in-view'));
  }

  const mapFrame = document.querySelector('.yandex-map');
  if (mapFrame && location.protocol !== 'file:') {
    mapFrame.addEventListener('load', () => mapFrame.closest('.map-embed-wrap')?.classList.add('has-live-map'), { once: true });
  }

  const navItems = [...document.querySelectorAll('.nav-item')];
  const sections = navItems.map((item) => document.querySelector(`#${item.dataset.section}`)).filter(Boolean);
  function setCurrentSection(id) {
    navItems.forEach((item) => {
      const current = item.dataset.section === id;
      item.classList.toggle('current', current);
      if (current) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setCurrentSection(visible.target.id);
    }, { rootMargin: '-37% 0px -49% 0px', threshold: [0, .15, .35, .6] });
    sections.forEach((section) => sectionObserver.observe(section));
  }
  setCurrentSection('about');

  let scrollFrame = false;
  const progress = document.querySelector('#scroll-progress');
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = true;
    window.requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollable > 0 ? window.scrollY / scrollable * 100 : 0;
      progress.style.width = `${percent}%`;
      scrollFrame = false;
    });
  }, { passive: true });

  const ambient = document.querySelector('#ambient-glow');
  if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('pointermove', (event) => {
      ambient.style.setProperty('--pointer-x', `${event.clientX}px`);
      ambient.style.setProperty('--pointer-y', `${event.clientY}px`);
    }, { passive: true });
    document.querySelectorAll('.service-card:not(.service-photo)').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty('--card-x', `${x * 100}%`);
        card.style.setProperty('--card-y', `${y * 100}%`);
        card.style.transform = `translateY(-3px) rotateX(${(0.5 - y) * 3}deg) rotateY(${(x - 0.5) * 3}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  document.querySelectorAll('.button, .nav-item, .calendar-arrows button, .theme-toggle, .admin-entry').forEach((element) => {
    element.addEventListener('pointerdown', (event) => {
      const rect = element.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'tap-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      element.append(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    });
  });

  let installPrompt = null;
  const installButton = document.querySelector('#install-app');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.textContent = 'Установить приложение';
  });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) {
      const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent);
      showToast(isAppleMobile ? 'В Safari нажмите «Поделиться» → «На экран Домой».' : 'Откройте меню браузера и выберите «Установить приложение» или «На главный экран».');
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.textContent = 'На экран телефона';
  });
  window.addEventListener('appinstalled', () => { installButton.textContent = 'Приложение установлено'; });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
