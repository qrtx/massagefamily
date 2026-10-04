(() => {
  const grid = document.querySelector('#calendar-grid');
  const monthLabel = document.querySelector('#month-label');
  const slotsDate = document.querySelector('#slots-date');
  const slotsHint = document.querySelector('#slots-hint');
  const timeSlots = document.querySelector('#time-slots');
  const submit = document.querySelector('#booking-submit');
  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const weekdays = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDay = null;
  let selectedTime = null;

  function keyFor(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function scheduleFor(date) {
    // This is a sample schedule for the visual demo; Elena confirms availability personally.
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
      if (selectedDay && keyFor(date) === keyFor(selectedDay)) button.classList.add('selected');
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
  document.querySelector('#year').textContent = String(new Date().getFullYear());

  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.main-nav');
  menuButton.addEventListener('click', () => {
    const opened = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(opened));
    menuButton.setAttribute('aria-label', opened ? 'Закрыть меню' : 'Открыть меню');
    menuButton.querySelector('use').setAttribute('href', opened ? '#i-close' : '#i-menu');
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('use').setAttribute('href', '#i-menu');
  }));

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('in-view'));
  }

  let installPrompt = null;
  const installButton = document.querySelector('#install-app');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
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
    installButton.hidden = true;
  });
  window.addEventListener('appinstalled', () => { installButton.hidden = true; });

  let toastTimer;
  function showToast(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 4200);
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
