(() => {
  const LOGIN = 'admin';
  const PASSWORD = 'massagefamily-demo';
  const sessionKey = 'massagefamily-demo-admin';
  const loginPanel = document.querySelector('#admin-login-panel');
  const workspace = document.querySelector('#admin-workspace');
  const loginForm = document.querySelector('#admin-login-form');
  const loginError = document.querySelector('#login-error');
  const status = document.querySelector('#database-status');
  const seedButton = document.querySelector('#seed-database');
  const serviceList = document.querySelector('#admin-service-list');
  const serviceCount = document.querySelector('#service-count');
  const monthLabel = document.querySelector('#admin-month-label');
  const calendarGrid = document.querySelector('#admin-calendar-grid');
  const selectedDateLabel = document.querySelector('#admin-selected-date');
  const closedInput = document.querySelector('#admin-day-closed');
  const bookingForm = document.querySelector('#admin-booking-form');
  const bookingTime = document.querySelector('#admin-time');
  const bookingList = document.querySelector('#admin-booking-list');
  const timeSlots = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const weekdays = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  const today = new Date();
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let dataTools = null;
  let data;
  let remoteActive = false;
  let unsubscribe = null;

  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const setStatus = (message, state = 'demo') => { status.textContent = message; status.dataset.state = state; };
  const getPath = (root, path) => path.split('/').filter(Boolean).reduce((value, key) => value?.[key], root);
  const clone = (value) => JSON.parse(JSON.stringify(value));

  async function connectDatabase() {
    const module = await import('./site-data.js');
    dataTools = module;
    data = module.readLocalData();
    renderAll();
    try {
      const firebase = await import('./firebase-client.js');
      remoteActive = true;
      unsubscribe = firebase.onValue(firebase.databaseRef(module.DB_PATH), (snapshot) => {
        const remote = snapshot.val();
        if (remote) {
          data = module.mergeData(remote);
          module.saveLocalData(data);
          seedButton.disabled = true;
          seedButton.textContent = 'Стартовые данные уже загружены';
          setStatus('Firebase подключён · данные синхронизируются онлайн', 'online');
        } else {
          seedButton.disabled = false;
          seedButton.textContent = 'Сохранить стартовые данные в Firebase';
          setStatus('Firebase доступен · база пока пустая, нажмите «Сохранить стартовые данные»', 'online');
        }
        renderAll();
      }, () => {
        remoteActive = false;
        setStatus('Firebase отклонил чтение правилом доступа · сейчас работает локальный демо-режим в этом браузере', 'offline');
      });
    } catch {
      remoteActive = false;
      setStatus('Нет соединения с Firebase · работает локальный демо-режим в этом браузере', 'offline');
    }
  }

  async function writePath(path, value, removeValue = false) {
    const localPath = path.replace(`${dataTools.DB_PATH}/`, '');
    const keys = localPath.split('/').filter(Boolean);
    if (keys[0] === 'services' && keys.length === 2) {
      data.services = data.services.filter((service) => service.id !== keys[1]);
      if (!removeValue) data.services.push(value);
    } else {
      const last = keys.pop();
      const parent = keys.reduce((node, key) => (node[key] ||= {}), data);
      if (removeValue) delete parent[last];
      else parent[last] = value;
    }
    dataTools.saveLocalData(data);
    renderAll();
    if (!remoteActive) return false;
    try {
      const firebase = await import('./firebase-client.js');
      const ref = firebase.databaseRef(path);
      if (removeValue) await firebase.remove(ref);
      else await firebase.set(ref, value);
      return true;
    } catch {
      remoteActive = false;
      setStatus('Firebase отклонил запись правилом доступа · изменение сохранено только локально в этом браузере', 'offline');
      return false;
    }
  }

  function renderServices() {
    const services = (data.services || []).filter((service) => service.active !== false);
    serviceCount.textContent = `${services.length} услуг`;
    serviceList.replaceChildren();
    services.forEach((service) => {
      const row = document.createElement('form'); row.className = 'admin-service-row'; row.dataset.id = service.id;
      row.innerHTML = `<label>Услуга<input name="name" required maxlength="90"></label><div class="form-pair"><label>Время<input name="duration" required maxlength="60"></label><label>Цена · ₽<input name="price" required type="number" min="0" step="100"></label></div><div class="admin-row-actions"><button class="button button-outline" type="submit">Сохранить</button><button class="admin-delete" type="button" aria-label="Удалить услугу"></button></div>`;
      row.elements.name.value = service.name || '';
      row.elements.duration.value = service.duration || '';
      row.elements.price.value = String(Number(service.price) || 0);
      row.addEventListener('submit', async (event) => {
        event.preventDefault();
        const updated = { ...service, name: row.elements.name.value.trim(), duration: row.elements.duration.value.trim(), price: Number(row.elements.price.value) };
        const saved = await writePath(`${dataTools.DB_PATH}/services/${service.id}`, updated);
        setStatus(saved ? `Сохранено в Firebase: ${updated.name}` : 'Сохранено локально; Firebase пока запрещает запись', saved ? 'online' : 'offline');
      });
      row.querySelector('.admin-delete').addEventListener('click', async () => {
        if (!window.confirm(`Убрать услугу «${service.name}» из каталога?`)) return;
        const saved = await writePath(`${dataTools.DB_PATH}/services/${service.id}`, { ...service, active: false });
        setStatus(saved ? 'Услуга удалена из Firebase' : 'Услуга убрана только в локальном демо', saved ? 'online' : 'offline');
      });
      serviceList.append(row);
    });
  }

  function renderDayDetails() {
    if (!selectedDate) { selectedDateLabel.textContent = 'Выберите день в календаре'; bookingList.replaceChildren(); return; }
    const key = dateKey(selectedDate);
    selectedDateLabel.textContent = `${selectedDate.getDate()} ${months[selectedDate.getMonth()].toLowerCase()}, ${weekdays[selectedDate.getDay()]}`;
    closedInput.checked = Boolean(data.calendar?.closedDays?.[key]);
    const appointments = data.calendar?.bookings?.[key] || {};
    bookingList.replaceChildren();
    const entries = Object.entries(appointments).sort(([a], [b]) => a.localeCompare(b));
    if (!entries.length) { const empty = document.createElement('p'); empty.className = 'empty-slots'; empty.textContent = 'На этот день пока нет добавленных занятий.'; bookingList.append(empty); return; }
    entries.forEach(([time, appointment]) => {
      const service = 'Занято';
      const item = document.createElement('div'); item.className = 'admin-booking-item';
      const details = document.createElement('span'); details.innerHTML = `<strong>${time}</strong><small></small>`; details.querySelector('small').textContent = service;
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'admin-delete'; remove.setAttribute('aria-label', `Удалить занятие ${time}`);
      remove.addEventListener('click', async () => {
        const saved = await writePath(`${dataTools.DB_PATH}/calendar/bookings/${key}/${time.replace(':', '-')}`, null, true);
        setStatus(saved ? `Окно ${time} освобождено` : `Окно ${time} освобождено локально`, saved ? 'online' : 'offline');
      });
      item.append(details, remove); bookingList.append(item);
    });
  }

  function renderCalendar() {
    monthLabel.textContent = `${months[month.getMonth()]} ${month.getFullYear()}`;
    calendarGrid.replaceChildren();
    const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let i = 0; i < offset; i += 1) { const spacer = document.createElement('span'); spacer.className = 'day-spacer'; spacer.setAttribute('aria-hidden', 'true'); calendarGrid.append(spacer); }
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day); const key = dateKey(date);
      const appointments = data.calendar?.bookings?.[key] || {}; const count = Object.keys(appointments).length;
      const closed = Boolean(data.calendar?.closedDays?.[key]);
      const button = document.createElement('button'); button.type = 'button'; button.className = `day-cell ${count || closed ? 'busy' : 'available'}`; button.textContent = String(day);
      button.setAttribute('aria-label', `${day} ${months[month.getMonth()]}, ${closed ? 'день закрыт' : count ? `${count} занятий` : 'свободный день'}`);
      if (dateKey(selectedDate || new Date(0)) === key) button.classList.add('selected');
      if (dateKey(new Date()) === key) button.classList.add('today');
      button.addEventListener('click', () => { selectedDate = date; renderCalendar(); renderDayDetails(); });
      calendarGrid.append(button);
    }
  }

  function renderAll() { if (!data) return; renderServices(); renderCalendar(); renderDayDetails(); }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = loginForm.elements.username.value.trim(); const password = loginForm.elements.password.value;
    if (username !== LOGIN || password !== PASSWORD) { loginError.hidden = false; return; }
    loginError.hidden = true;
    try { sessionStorage.setItem(sessionKey, '1'); } catch { /* Session may be unavailable. */ }
    loginPanel.hidden = true; workspace.hidden = false; connectDatabase();
  });

  document.querySelector('#admin-logout').addEventListener('click', () => {
    try { sessionStorage.removeItem(sessionKey); } catch { /* Session may be unavailable. */ }
    if (unsubscribe) unsubscribe(); workspace.hidden = true; loginPanel.hidden = false; loginForm.reset();
  });

  seedButton.addEventListener('click', async () => {
    if (!window.confirm('Записать стартовый каталог и пустой календарь massagefamily в Realtime Database?')) return;
    const firebase = await import('./firebase-client.js');
    try {
      const existing = await firebase.get(firebase.databaseRef(dataTools.DB_PATH));
      if (existing.exists()) { seedButton.disabled = true; setStatus('В базе уже есть данные — стартовая запись отменена, чтобы ничего не перезаписать', 'online'); return; }
      const initial = clone(dataTools.emptyData());
      initial.services = Object.fromEntries(initial.services.map((service) => [service.id, service]));
      await firebase.set(firebase.databaseRef(dataTools.DB_PATH), initial);
      seedButton.disabled = true;
      seedButton.textContent = 'Стартовые данные уже загружены';
      remoteActive = true; setStatus('Стартовые данные записаны в Firebase', 'online');
    } catch {
      setStatus('База доступна только для чтения или правила закрыты; стартовые данные не отправлены', 'offline');
    }
  });

  document.querySelector('#new-service-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget;
    const name = form.elements.name.value.trim(); const id = `${name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
    const service = { id, name, duration: form.elements.duration.value.trim(), price: Number(form.elements.price.value) };
    const saved = await writePath(`${dataTools.DB_PATH}/services/${id}`, service);
    form.reset(); setStatus(saved ? `Добавлена услуга: ${name}` : 'Услуга добавлена локально; Firebase пока запрещает запись', saved ? 'online' : 'offline');
  });

  document.querySelector('#admin-prev-month').addEventListener('click', () => {
    const prior = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    if (prior < new Date(today.getFullYear(), today.getMonth(), 1)) return;
    month = prior; renderCalendar();
  });
  document.querySelector('#admin-next-month').addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); renderCalendar(); });

  closedInput.addEventListener('change', async () => {
    if (!selectedDate) return;
    const key = dateKey(selectedDate); const value = closedInput.checked ? true : null;
    const saved = await writePath(`${dataTools.DB_PATH}/calendar/closedDays/${key}`, value, !closedInput.checked);
    setStatus(saved ? (closedInput.checked ? 'День закрыт в Firebase' : 'День открыт в Firebase') : 'Статус дня изменён только локально', saved ? 'online' : 'offline');
  });

  bookingTime.replaceChildren(...timeSlots.map((time) => { const option = document.createElement('option'); option.value = time; option.textContent = time; return option; }));
  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault(); if (!selectedDate) return;
    const key = dateKey(selectedDate); const time = bookingTime.value;
    if (data.calendar?.closedDays?.[key]) { setStatus('Сначала откройте этот день для записи', 'offline'); return; }
    if (data.calendar?.bookings?.[key]?.[time.replace(':', '-')]) { setStatus('Это время уже отмечено занятым', 'offline'); return; }
    const booking = { booked: true, createdAt: new Date().toISOString() };
    const saved = await writePath(`${dataTools.DB_PATH}/calendar/bookings/${key}/${time.replace(':', '-')}`, booking);
    setStatus(saved ? `Занятие на ${time} записано в Firebase` : `Занятие на ${time} сохранено локально`, saved ? 'online' : 'offline');
  });

  try { if (sessionStorage.getItem(sessionKey) === '1') { loginPanel.hidden = true; workspace.hidden = false; connectDatabase(); } } catch { /* Start at the login form. */ }
})();
