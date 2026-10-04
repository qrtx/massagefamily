(() => {
  const monthLabel = document.querySelector('#month-label');
  const grid = document.querySelector('#calendar-grid');
  const slots = document.querySelector('#time-slots');
  const slotsDate = document.querySelector('#slots-date');
  const hint = document.querySelector('#slots-hint');
  const submit = document.querySelector('#booking-submit');
  const service = document.querySelector('#service-select');
  const names = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = null;
  let selectedTime = '';
  const pad = (n) => String(n).padStart(2, '0');
  const times = ['10:00','12:00','14:00','16:00','18:00','20:00'];
  let liveData;
  let dataTools;
  const status = document.createElement('p');
  status.className = 'calendar-data-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Загружаю расписание…';
  document.querySelector('.booking-card')?.before(status);
  const available = (date) => {
    if (dataTools && liveData) return dataTools.availableSlots(date, liveData);
    if (date.getDay() === 0) return [];
    const seed = date.getDate() + date.getMonth() * 13 + date.getFullYear();
    return times.filter((_, i) => (seed + i * 3) % 5 !== 0);
  };
  function renderSlots(date) {
    selectedDate = date;
    selectedTime = '';
    submit.disabled = true;
    slotsDate.textContent = `${date.getDate()} ${names[date.getMonth()].toLowerCase()}`;
    const open = available(date);
    slots.replaceChildren();
    hint.textContent = open.length ? 'Выберите время — его нужно будет подтвердить.' : 'В этот день окон нет.';
    for (const time of times) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `time-slot${open.includes(time) ? '' : ' busy'}`;
      button.textContent = time;
      button.disabled = !open.includes(time);
      button.setAttribute('aria-pressed', 'false');
      if (!open.includes(time)) button.setAttribute('aria-label', `${time}, занято`);
      button.addEventListener('click', () => {
        slots.querySelectorAll('.time-slot').forEach((item) => { item.classList.remove('selected'); item.setAttribute('aria-pressed','false'); });
        button.classList.add('selected'); button.setAttribute('aria-pressed','true'); selectedTime = time; submit.disabled = false;
      });
      slots.append(button);
    }
    if (!open.length) slots.innerHTML = '<p class="empty-slots">Буду рада подобрать другой день.</p>';
  }
  function renderCalendar() {
    monthLabel.textContent = `${names[month.getMonth()]} ${month.getFullYear()}`;
    grid.replaceChildren();
    const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let i = 0; i < offset; i++) { const spacer = document.createElement('span'); spacer.className = 'day-spacer'; spacer.setAttribute('aria-hidden','true'); grid.append(spacer); }
    for (let day = 1; day <= days; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const open = available(date).length > 0;
      const past = date < today;
      const button = document.createElement('button'); button.type = 'button'; button.className = `day-cell ${open ? 'available' : 'busy'}`; button.textContent = String(day);
      button.disabled = past || !open; button.setAttribute('aria-pressed','false');
      button.setAttribute('aria-label', `${day} ${names[month.getMonth()]}, ${past ? 'дата прошла' : open ? 'есть окна' : 'нет окон'}`);
      if (+date === +today) button.classList.add('today');
      if (selectedDate && +date === +selectedDate) { button.classList.add('selected'); button.setAttribute('aria-pressed','true'); }
      button.addEventListener('click', () => { grid.querySelectorAll('.day-cell').forEach((item) => { item.classList.remove('selected'); item.setAttribute('aria-pressed','false'); }); button.classList.add('selected'); button.setAttribute('aria-pressed','true'); renderSlots(date); });
      grid.append(button);
    }
  }
  document.querySelector('#prev-month').addEventListener('click', () => {
    const prior = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    if (prior < new Date(today.getFullYear(), today.getMonth(), 1)) return;
    month = prior; selectedDate = null; selectedTime = ''; submit.disabled = true; slotsDate.textContent = 'Выберите день'; slots.innerHTML = '<p class="empty-slots">Выберите дату, чтобы увидеть время.</p>'; renderCalendar();
  });
  document.querySelector('#next-month').addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); selectedDate = null; selectedTime = ''; submit.disabled = true; slotsDate.textContent = 'Выберите день'; slots.innerHTML = '<p class="empty-slots">Выберите дату, чтобы увидеть время.</p>'; renderCalendar(); });
  submit.addEventListener('click', () => {
    if (!selectedDate || !selectedTime) return;
    const date = `${selectedDate.getDate()} ${names[selectedDate.getMonth()].toLowerCase()} ${selectedDate.getFullYear()}`;
    const serviceName = service.selectedOptions[0]?.textContent || 'массаж';
    const message = `Здравствуйте, Елена! Хочу записаться на ${serviceName.toLowerCase()} ${date} в ${selectedTime}. Подтвердите, пожалуйста, свободно ли это время и актуальную стоимость.`;
    window.open(`https://t.me/elenabelova77?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });
  renderCalendar();
  import('./site-data.js').then((module) => {
    dataTools = module;
    liveData = module.readLocalData();
    return import('./firebase-client.js');
  }).then((firebase) => {
    firebase.onValue(firebase.databaseRef('siteData'), (snapshot) => {
      liveData = dataTools.mergeData(snapshot.val());
      dataTools.saveLocalData(liveData);
      status.textContent = snapshot.exists() ? 'Расписание обновляется онлайн · свободное время предварительное' : 'Демо-расписание · база пока пустая';
      renderCalendar();
      if (selectedDate) renderSlots(selectedDate);
    }, () => { status.textContent = 'Локальное демо-расписание · нет доступа к базе'; });
  }).catch(() => { status.textContent = 'Локальное демо-расписание'; });
})();
