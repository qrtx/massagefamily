import { DEFAULT_SERVICES, mergeData, readLocalData, saveLocalData } from './site-data.js';

const lists = document.querySelectorAll('[data-live-price-list], .price-list');
const serviceSelect = document.querySelector('#service-select');

if (document.body.classList.contains('prices-page')) document.title = 'Услуги и цены — massagefamily';
const priceNav = document.querySelector('.floating-nav a[href$="prices.html"]');
if (priceNav) {
  const icon = priceNav.querySelector('.nav-icon');
  const label = priceNav.querySelector('span:last-child');
  if (icon) icon.textContent = '✧';
  if (label) label.textContent = 'Услуги';
  priceNav.setAttribute('aria-label', 'Услуги и цены');
}

function render(data) {
  lists.forEach((list) => {
    list.replaceChildren();
    data.services.forEach((service) => {
      const row = document.createElement('div');
      row.className = 'price-row';
      const copy = document.createElement('div');
      const name = document.createElement('b');
      const duration = document.createElement('small');
      const description = document.createElement('p');
      const price = document.createElement('strong');
      name.textContent = service.name;
      duration.textContent = service.duration;
      description.className = 'price-description';
      description.textContent = service.description || 'Подход, зоны и интенсивность подбираются индивидуально после короткого разговора.';
      price.textContent = `от ${Number(service.price).toLocaleString('ru-RU')} ₽`;
      copy.append(name, duration, description);
      row.append(copy, price);
      list.append(row);
    });
  });
  if (serviceSelect) {
    const selected = serviceSelect.value;
    serviceSelect.replaceChildren();
    const askOption = document.createElement('option');
    askOption.value = '';
    askOption.textContent = 'Пока не знаю — хочу посоветоваться';
    serviceSelect.append(askOption);
    data.services.forEach((service) => {
      const option = document.createElement('option');
      option.value = service.id;
      option.textContent = service.name;
      serviceSelect.append(option);
    });
    if ([...serviceSelect.options].some((option) => option.value === selected)) serviceSelect.value = selected;
  }
}

render(readLocalData());
import('./firebase-client.js').then(({ databaseRef, onValue }) => {
  onValue(databaseRef('siteData'), (snapshot) => {
    const data = mergeData(snapshot.val());
    saveLocalData(data);
    render(data);
  }, () => render({ services: DEFAULT_SERVICES }));
}).catch(() => render({ services: DEFAULT_SERVICES }));
