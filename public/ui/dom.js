export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === 'class') node.className = value;
    else if (name === 'text') node.textContent = value;
    else if (name.startsWith('on') && typeof value === 'function') node.addEventListener(name.slice(2).toLowerCase(), value);
    else if (name === 'checked' || name === 'disabled' || name === 'hidden') node[name] = Boolean(value);
    else if (name === 'value') node.value = value;
    else node.setAttribute(name, value === true ? '' : String(value));
  }
  children.flat(Infinity).forEach(child => {
    if (child === null || child === undefined || child === false) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

export function icon(name, className = '') {
  const paths = {
    arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
    back: ['M19 12H5', 'm11 6-6 6 6 6'],
    bookmark: ['M6 4h12v17l-6-4-6 4z'],
    check: ['m5 12 4 4L19 6'],
    search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14', 'm16 16 4 4'],
    clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M12 7v5l3 2'],
    external: ['M14 4h6v6', 'm20 4-9 9', 'M10 4H4v16h16v-6'],
    print: ['M7 8V3h10v5', 'M7 16H3V8h18v8h-4', 'M7 13h10v8H7z'],
    book: ['M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3z', 'M12 6v16'],
    play: ['m9 5 11 7-11 7z'],
    leaf: ['M5 20C3 8 10 4 21 3c-1 11-5 17-15 14', 'M5 20 16 9'],
    cross: ['m6 6 12 12', 'M6 18 18 6'],
    list: ['M8 6h13M8 12h13M8 18h13', 'M3 6h1M3 12h1M3 18h1'],
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: `icon ${className}` })) svg.setAttribute(key, value);
  for (const d of paths[name] || paths.arrow) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

export function safeURL(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function sourceLink(source, label, seconds = null) {
  let href = safeURL(source?.url);
  if (!href) return el('span', { class: 'unavailable-link' }, label || source?.title || '未提供有效來源');
  const parsed = new URL(href);
  const isYouTube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(parsed.hostname);
  if (isYouTube && Number.isFinite(seconds) && seconds >= 0) {
    parsed.searchParams.set('t', `${Math.floor(seconds)}s`);
    href = parsed.href;
  }
  return el('a', { href, target: '_blank', rel: 'noopener noreferrer', class: 'source-link' }, label || source.title, icon('external'));
}

export function timecode(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  return hours ? `${hours}:${String(Math.floor(total / 60) % 60).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` : `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

let toastTimer;
export function toast(message) {
  const target = document.getElementById('toast');
  if (!target) return;
  target.textContent = message;
  target.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { target.hidden = true; }, 4500);
}

export function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { toast('瀏覽器目前無法儲存，重新整理後可能無法保留進度。'); return false; }
}

export function textBlock(text, className = '') {
  return el('p', { class: `preserve-lines ${className}`.trim() }, text || '');
}
