import { readStored } from '../ui/dom.js';

const favoritesKey = 'method-studio:favorites:v1';
const badge = document.getElementById('saved-count');
let methods = [];

function updateSavedCount() {
  const saved = readStored(favoritesKey, []);
  const ids = new Set(Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : []);
  const count = methods.filter(method => method.status === 'ready' && ids.has(method.id)).length;
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

fetch('/data/catalog.json')
  .then(response => response.ok ? response.json() : Promise.reject())
  .then(catalog => { methods = catalog.methods; updateSavedCount(); })
  .catch(() => { badge.hidden = true; });

window.addEventListener('storage', event => {
  if (event.key === favoritesKey || event.key === null) updateSavedCount();
});
window.addEventListener('pageshow', updateSavedCount);
