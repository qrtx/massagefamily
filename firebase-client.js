import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getDatabase, ref, get, onValue, set, update, remove } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD0_92cXKBY3Jv0smjktyNo4GoLK5g-uGk',
  authDomain: 'massagefamily-4e8b4.firebaseapp.com',
  databaseURL: 'https://massagefamily-4e8b4-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'massagefamily-4e8b4',
  appId: '1:787137866062:web:46438afad46f0d3515161f'
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const databaseRef = (path = '') => ref(database, path);
export { get, onValue, set, update, remove };
