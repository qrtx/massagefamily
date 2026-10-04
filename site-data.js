export const DB_PATH = 'siteData';
export const LOCAL_DATA_KEY = 'massagefamily-demo-data-v1';
export const TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

export const DEFAULT_SERVICES = [
  { id: 'recovery', name: 'Оздоровительный / восстановительный массаж', duration: '1 час 30 минут', price: 5000 },
  { id: 'anti-stress', name: 'Антистрессовый массаж', duration: '1 час 30 минут', price: 5000 },
  { id: 'arm', name: 'Артикуляционно-рефлекторный массаж · АРМ', duration: '1 час', price: 5000 },
  { id: 'lymphatic', name: 'Лимфодренажный массаж', duration: '1 час 30 минут', price: 5000 },
  { id: 'myofascial', name: 'Миофасциальный массаж', duration: '1 час 30 минут', price: 5500 },
  { id: 'visceral', name: 'Висцеральный массаж', duration: '1 час 30 минут', price: 6000 },
  { id: 'face', name: 'Массаж лица', duration: '1 час 30 минут', price: 5000 },
  { id: 'bms-face', name: 'БМС-массаж лица на аппарате Назарова', duration: '1 час', price: 5000 },
  { id: 'full-body', name: 'Массаж всего тела', duration: '2 часа', price: 7000 },
  { id: 'chest', name: 'Массаж груди', duration: '1 час 30 минут', price: 5000 },
  { id: 'pelvic-floor', name: 'Массаж тазового дна', duration: '1 час', price: 5000 },
  { id: 'relax', name: 'Расслабляющий массаж', duration: '1 час 30 минут', price: 5000 },
  { id: 'taping', name: 'Кинезиотейпирование / тейпирование', duration: '15 минут · тейпы приобретаются отдельно', price: 1000 }
];

export function emptyData() {
  return { services: DEFAULT_SERVICES.map((service) => ({ ...service })), calendar: { bookings: {}, closedDays: {} } };
}

export function mergeData(data) {
  const defaults = emptyData();
  if (!data || typeof data !== 'object') return defaults;
  const remoteServices = data.services && typeof data.services === 'object' ? data.services : {};
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
  if (date.getDay() === 0 || data?.calendar?.closedDays?.[key]) return [];
  const seed = date.getDate() + date.getMonth() * 13 + date.getFullYear();
  const sample = TIME_SLOTS.filter((_, index) => (seed + index * 3) % 5 !== 0);
  const booked = data?.calendar?.bookings?.[key] || {};
  return sample.filter((time) => !booked[time.replace(':', '-')]);
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
