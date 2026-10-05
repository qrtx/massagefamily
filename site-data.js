export const DB_PATH = 'siteData';
export const LOCAL_DATA_KEY = 'massagefamily-demo-data-v2';
export const TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

export const DEFAULT_SERVICES = [
  { id: 'recovery', name: 'Оздоровительный / восстановительный массаж', duration: '1 час 30 минут', price: 5000, description: 'Комплексный сеанс: под запрос можно сочетать классические и мягкие восстановительные приёмы. Зоны и интенсивность обсуждаем до начала.' },
  { id: 'anti-stress', name: 'Антистрессовый массаж', duration: '1 час 30 минут', price: 5000, description: 'Сеанс с акцентом на расслабление и ощущение комфорта. Темп и глубину воздействия подбираю по вашим ощущениям.' },
  { id: 'arm', name: 'Артикуляционно-рефлекторный массаж по методике А. С. Иванова · АРМ', duration: '1 час', price: 5000, description: 'АРМ по методике А. С. Иванова — бережная работа с телом. Подходит не всем; формат и самочувствие обязательно обсудим до сеанса.' },
  { id: 'lymphatic', name: 'Лимфодренажный массаж', duration: '1 час 30 минут', price: 5000, description: 'Последовательная мягкая проработка с лимфодренажными приёмами. Интенсивность подбираю индивидуально.' },
  { id: 'myofascial', name: 'Миофасциальный массаж', duration: '1 час 30 минут', price: 5500, description: 'Более глубокая работа с фасциями и мышечным напряжением; особое внимание — чувствительным зонам и вашим ощущениям.' },
  { id: 'visceral', name: 'Висцеральный массаж', duration: '1 час 30 минут', price: 6000, description: 'Деликатная ручная работа с областью живота. До сеанса обсудим самочувствие, противопоказания и комфортность такого формата.' },
  { id: 'face', name: 'Массаж лица', duration: '1 час 30 минут', price: 5000, description: 'Спокойная ручная проработка лица, шеи и зоны декольте — с учётом чувствительности кожи и ваших пожеланий.' },
  { id: 'bms-face', name: 'БМС-массаж лица на аппарате Назарова', duration: '1 час', price: 5000, description: 'Сеанс с аппаратом Назарова для биомеханической стимуляции. Подход и интенсивность обсудим заранее.' },
  { id: 'full-body', name: 'Массаж всего тела', duration: '2 часа', price: 7000, description: 'Продолжительный сеанс для последовательной работы с разными зонами тела. Состав и интенсивность согласуем перед началом.' },
  { id: 'chest', name: 'Массаж груди', duration: '1 час 30 минут', price: 5000, description: 'Деликатная работа с областью груди и плечевого пояса. Возможность и формат процедуры предварительно обсуждаются индивидуально.' },
  { id: 'pelvic-floor', name: 'Массаж тазового дна', duration: '1 час', price: 5000, description: 'Бережная работа с областью тазового дна — только с вашего согласия и с учётом самочувствия. Детали обсудим до записи.' },
  { id: 'relax', name: 'Расслабляющий массаж', duration: '1 час 30 минут', price: 5000, description: 'Неспешный сеанс, где комфорт и возможность немного выдохнуть — в приоритете.' },
  { id: 'taping', name: 'Кинезиотейпирование / тейпирование', duration: '15 минут · тейпы приобретаются отдельно', price: 1000, description: 'Наложение кинезиотейпа по выбранной зоне. Схему обсудим заранее; тейпы приобретаются отдельно.' }
];

export function emptyData() {
  return { services: DEFAULT_SERVICES.map((service) => ({ ...service })), calendar: { bookings: {}, closedDays: {} } };
}

export function mergeData(data) {
  const defaults = emptyData();
  if (!data || typeof data !== 'object') return defaults;
  const remoteServices = Array.isArray(data.services)
    ? Object.fromEntries(data.services.filter((service) => service && service.id).map((service) => [service.id, service]))
    : data.services && typeof data.services === 'object' ? data.services : {};
  defaults.services = defaults.services.map((service) => ({ ...service, ...(remoteServices[service.id] || {}) })).filter((service) => service.active !== false);
  Object.entries(remoteServices).forEach(([id, service]) => {
    if (!defaults.services.some((entry) => entry.id === id) && service?.active !== false) defaults.services.push({ id, ...service });
  });
  defaults.calendar = {
    bookings: data.calendar?.bookings && typeof data.calendar.bookings === 'object' ? data.calendar.bookings : {},
    closedDays: data.calendar?.closedDays && typeof data.calendar.closedDays === 'object' ? data.calendar.closedDays : {}
  };
  return defaults;
}

export function readLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    return raw ? mergeData(JSON.parse(raw)) : emptyData();
  } catch {
    return emptyData();
  }
}

export function saveLocalData(data) {
  try { localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data)); } catch { /* Local fallback is best-effort. */ }
}

export function availableSlots(date, data) {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  if (data?.calendar?.closedDays?.[key]) return [];
  const booked = data?.calendar?.bookings?.[key] || {};
  return TIME_SLOTS.filter((time) => !booked[time.replace(':', '-')]);
}

export function subscribeToData(onData, onError) {
  import('./firebase-client.js').then((firebase) => {
    const unsubscribe = firebase.onValue(firebase.databaseRef(DB_PATH), (snapshot) => onData(mergeData(snapshot.val())), onError);
    window.dispatchEvent(new CustomEvent('massagefamily:data-listener', { detail: unsubscribe }));
  }).catch(onError);
}

export async function loadRemoteData() {
  const firebase = await import('./firebase-client.js');
  const snapshot = await firebase.get(firebase.databaseRef(DB_PATH));
  return { firebase, data: mergeData(snapshot.val()) };
}
