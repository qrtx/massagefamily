import { DEFAULT_SERVICES, mergeData, readLocalData, saveLocalData } from './site-data.js';

const lists = document.querySelectorAll('[data-live-price-list], .price-list');
const serviceSelect = document.querySelector('#service-select');

function render(data) {
  lists.forEach((list) => {
    list.replaceChildren();
    data.services.forEach((service) => {
      const row = document.createElement('div');
      row.className = 'price-row';
      const description = document.createElement('div');
      const name = document.createElement('b');
      const duration = document.createElement('small');
      const price = document.createElement('strong');
      name.textContent = service.name;
      duration.textContent = service.duration;
      price.textContent = `от ${Number(service.price).toLocaleString('ru-RU')} ₽`;
      description.append(name, duration);
      row.append(description, price);
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
