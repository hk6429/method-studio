import { el, icon, readStored, writeStored, toast } from './ui/dom.js';
import { renderMethod } from './ui/method.js';
import { CONTENT_TYPES, selectMethods, splitMethods } from './ui/library.js';
import { characterImage, renderCompanions } from './ui/brand.js';

const main = document.getElementById('main');
const FAVORITES_KEY = 'method-studio:favorites:v1';
const savedValue = readStored(FAVORITES_KEY, []);
let favorites = new Set(Array.isArray(savedValue) ? savedValue.filter(id => typeof id === 'string') : []);
let catalog = null;
let searchTimer;
const filters = { category: 'all', topic: 'all', contentType: 'all', query: '', saved: false, sort: 'newest' };

function readyMethods() {
  return catalog.methods.filter(method => method.status === 'ready');
}

function validFavorites() {
  return readyMethods().filter(method => favorites.has(method.id));
}

function updateSavedCount() {
  const count = catalog ? validFavorites().length : 0;
  const badge = document.getElementById('saved-count');
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  writeStored(FAVORITES_KEY, [...favorites]);
  updateSavedCount();
  toast(favorites.has(id) ? '已加入收藏，下次從「我的收藏」接著練習。' : '已從收藏移除。');
}

function setActiveNav(name) {
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function renderHero() {
  const hero = el('section', { class: 'hero ink-hero', 'aria-labelledby': 'home-title' },
    el('div', { class: 'hero-copy' },
      el('div', { class: 'eyebrow hero-kicker' }, el('span', { class: 'tiny-line', 'aria-hidden': 'true' }), '一間，把方法帶進生活的書院'),
      el('h1', { id: 'home-title' }, '把看過的方法，', el('br'), el('span', {}, '變成做得到的步驟。')),
      el('p', { class: 'hero-description' }, '學習 AI、練習英文、讀懂世界，也照顧身體。把值得留下的方法，整理成步驟、圖解與練習，今天就從一件小事開始。'),
      el('div', { class: 'hero-actions' }, el('a', { class: 'button button-primary', href: '#library' }, '找一個方法開始', icon('arrow')), el('a', { class: 'text-button', href: '#companions' }, '認識練習夥伴', icon('arrow'))),
      el('p', { class: 'hero-footnote' }, el('span', { class: 'little-spark', 'aria-hidden': 'true' }, '✳'), '一次一個方法，留一點時間給練習。')
    ),
    el('figure', { class: 'hero-art' },
      el('picture', {},
        el('source', { media: '(min-width: 801px)', srcset: '/assets/brand/immersive-hero-medium.webp 1440w, /assets/brand/immersive-hero.webp 2048w', sizes: '100vw', width: 2048, height: 1024 }),
        el('img', { src: '/assets/brand/companions-hero-small.webp', srcset: '/assets/brand/companions-hero-small.webp 768w, /assets/brand/companions-hero.webp 1536w', sizes: '100vw', width: 1536, height: 1024, fetchpriority: 'high', decoding: 'async', alt: '臺灣國風水墨書院：阿問、知行、以澄、小硯與臺灣犬墨丸，在山水與紅磚書院間一起練習。' })),
      el('figcaption', {}, el('span', {}, '提問'), el('span', {}, '拆解'), el('span', {}, '試做'), el('span', {}, '回看')))
  );
  return hero;
}

function articlePath(method) {
  return typeof method?.articlePath === 'string' && /^\/articles\/[a-z0-9-]+\.html$/.test(method.articlePath) ? method.articlePath : null;
}

function renderMethodCard(method, index, updateResults) {
  const category = catalog.categories.find(item => item.id === method.categoryId);
  const topicLabels = (method.topicIds || []).map(id => category?.topics?.find(topic => topic.id === id)?.name || id);
  const favorite = favorites.has(method.id);
  const bookmark = el('button', { type: 'button', class: `card-bookmark${favorite ? ' is-saved' : ''}`, 'aria-label': `${favorite ? '取消收藏' : '收藏'}：${method.title}`, 'aria-pressed': String(favorite), onClick: () => {
    toggleFavorite(method.id);
    updateResults();
    const replacement = [...document.querySelectorAll('[data-method-id]')].find(card => card.dataset.methodId === method.id);
    (replacement?.querySelector('.card-bookmark') || document.getElementById('method-search'))?.focus({ preventScroll: true });
  } }, icon('bookmark'));
  const link = articlePath(method) || `#method=${encodeURIComponent(method.id)}`;
  const sourceLabel = method.contentType === 'editorial_example' ? '編輯示範' : method.coverLabel || '方法筆記';
  const typeName = CONTENT_TYPES.find(type => type.id === method.contentType)?.name;
  const date = method.publishedAt ? new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(method.publishedAt)) : '';
  return el('article', { class: `method-card category-${category?.id || 'other'}`, 'data-method-id': method.id },
    method.overview ? el('a', { href: link, class: 'card-illustration', tabindex: '-1', 'aria-hidden': 'true' }, el('img', { src: method.overview.cardImage, alt: '', width: 800, height: 480, loading: 'lazy', decoding: 'async' })) : null,
    el('div', { class: 'card-top' }, el('span', { class: 'card-index' }, String(index + 1).padStart(2, '0')), el('span', { class: 'card-category' }, category?.name || '其他方法'), method.pinned ? el('span', { class: 'pinned-badge' }, '置頂') : null, bookmark),
    el('div', { class: 'card-body' }, el('div', { class: 'card-topics' }, ...topicLabels.map(topic => el('span', {}, topic))), el('h4', { class: 'card-title' }, el('a', { href: link }, method.title)), textBlockOrSummary(method.summary), el('div', { class: 'card-output' }, el('span', {}, '做完帶走'), el('strong', {}, method.output || '一份自己的練習成果'))),
    el('div', { class: 'card-bottom' }, el('div', { class: 'card-meta' }, method.minutes ? el('span', {}, icon('clock'), `${method.minutes} 分鐘`) : null, method.level ? el('span', {}, method.level) : null), el('a', { href: link, class: 'card-read', 'aria-label': `開始練習：${method.title}` }, icon('arrow'))),
    el('div', { class: 'card-source-status' }, el('span', {}, typeName ? `${typeName} · ${sourceLabel}` : sourceLabel), date ? el('time', { class: 'card-date', datetime: method.publishedAt }, `${date} 發布`) : null, method.sourceCoverage ? el('p', {}, method.sourceCoverage) : null)
  );
}

function textBlockOrSummary(text) {
  return el('p', { class: 'card-summary' }, text || '');
}

function emptyState(hasQuery, clearFilters) {
  const isCompletelyEmpty = readyMethods().length === 0;
  const title = hasQuery ? '還沒找到符合的方法。' : filters.saved ? '留給下次的好方法，都會在這裡。' : '第一篇方法，正在準備中。';
  const copy = hasQuery ? '換個關鍵字，或調整分類再試試。' : filters.saved ? '看到想練習的文章，按下收藏；下一次回來，就從這裡開始。' : '這裡會收錄已經整理好的學習文章。你可以先看看文章版型，試著勾選步驟，走一遍練習流程。';
  const box = el('div', { class: 'empty-state' },
    el('div', { class: 'empty-companion', 'aria-hidden': 'true' }, characterImage('mowan', { size: 180, eager: true })),
    el('div', { class: 'empty-copy' }, el('span', { class: 'eyebrow' }, filters.saved ? 'YOUR COLLECTION' : hasQuery ? 'KEEP EXPLORING' : 'A PLACE TO BEGIN'), el('h3', {}, title), el('p', {}, copy),
      hasQuery ? el('button', { type: 'button', class: 'button button-quiet button-small', onClick: clearFilters }, '清除篩選，看看全部方法', icon('arrow')) : null,
      catalog.demo && (isCompletelyEmpty || filters.saved) ? el('a', { href: '#preview', class: 'button button-quiet button-small' }, '看看文章版型', icon('arrow')) : null,
      filters.saved && !isCompletelyEmpty ? el('a', { href: '#library', class: 'text-button' }, '去找一個方法', icon('arrow')) : null
    )
  );
  return box;
}

function renderHome() {
  const home = el('div', { class: 'home-page' });
  if (!filters.saved) home.append(renderHero());
  const section = el('section', { class: `library page-width${filters.saved ? ' saved-library' : ''}`, id: 'library', 'aria-labelledby': 'library-title' });
  const heading = el('div', { class: 'library-heading' },
    el('div', {}, el('span', { class: 'eyebrow' }, filters.saved ? 'SAVED FOR YOUR NEXT STEP' : 'THE METHOD LIBRARY'), el('h2', { id: 'library-title' }, filters.saved ? '我的收藏' : '從你想練習的開始。')),
    el('div', { class: 'library-greeting' }, characterImage('awen', { size: 72 }), el('p', {}, filters.saved ? '把有用的方法留下，找時間慢慢練。' : '阿問陪你找：今天想練習什麼？'))
  );
  section.append(heading);
  const categoryButtons = [];
  const topicArea = el('div', { class: 'topic-filters', 'aria-label': '依主題篩選' });
  const results = el('div', { class: 'results-area' });
  const countLabel = el('p', { class: 'results-count', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const searchInput = el('input', { id: 'method-search', type: 'search', name: 'q', placeholder: '搜尋工具、主題，或你想做到的事…', value: filters.query, autocomplete: 'off', 'aria-label': '搜尋站內方法文章' });
  const clearSearch = el('button', { type: 'button', class: 'clear-search', 'aria-label': '清除搜尋文字', hidden: !filters.query, onClick: () => { searchInput.value = ''; filters.query = ''; updateResults(); searchInput.focus(); } }, icon('cross'));
  const typeSelect = el('select', { id: 'method-type', name: 'type', onChange: event => { filters.contentType = event.target.value; updateResults(); } },
    [{ id: 'all', name: '全部種類' }, ...CONTENT_TYPES].map(type => el('option', { value: type.id }, type.name)));
  const sortSelect = el('select', { id: 'method-sort', name: 'sort', onChange: event => { filters.sort = event.target.value; updateResults(); } },
    [['newest', '最新發布'], ['oldest', '最早發布'], ['shortest', '練習時間：短到長'], ['title', '文章標題']].map(([value, label]) => el('option', { value }, label)));
  typeSelect.value = filters.contentType;
  sortSelect.value = filters.sort;
  const resetButton = el('button', { type: 'button', class: 'reset-filters', onClick: clearFilters }, '清除篩選', icon('cross'));

  function clearFilters() {
    filters.category = 'all'; filters.topic = 'all'; filters.query = ''; filters.contentType = 'all'; filters.sort = 'newest';
    searchInput.value = '';
    typeSelect.value = 'all'; sortSelect.value = 'newest';
    if (!filters.saved) setActiveNav(null);
    updateCategoryButtons();
    updateTopics();
    updateResults();
    searchInput.focus();
  }

  function updateCategoryButtons() {
    categoryButtons.forEach(({ button, id, countLabel }) => {
      button.classList.toggle('is-active', filters.category === id);
      button.setAttribute('aria-pressed', String(filters.category === id));
      const count = readyMethods().filter(method => (!filters.saved || favorites.has(method.id)) && (id === 'all' || method.categoryId === id)).length;
      countLabel.textContent = String(count);
      countLabel.setAttribute('aria-label', `${count} 篇`);
    });
  }

  function updateTopics() {
    const category = catalog.categories.find(item => item.id === filters.category);
    const topics = category ? category.topics || [] : [];
    topicArea.hidden = topics.length === 0;
    topicArea.replaceChildren();
    if (!topics.length) return;
    const topicButtons = [];
    const topicChoices = [{ id: 'all', name: '全部主題' }, ...topics];
    topicChoices.forEach(topic => {
      const button = el('button', { type: 'button', class: `topic-chip${filters.topic === topic.id ? ' is-active' : ''}`, 'aria-pressed': String(filters.topic === topic.id), onClick: () => {
        filters.topic = topic.id;
        topicButtons.forEach(item => {
          item.button.classList.toggle('is-active', item.id === topic.id);
          item.button.setAttribute('aria-pressed', String(item.id === topic.id));
        });
        updateResults();
      } }, topic.name);
      topicButtons.push({ button, id: topic.id });
      topicArea.append(button);
    });
  }

  function updateResults() {
    updateCategoryButtons();
    const query = filters.query.trim();
    const methods = selectMethods(catalog.methods, catalog.categories, filters, favorites);
    clearSearch.hidden = !filters.query;
    const categoryName = catalog.categories.find(item => item.id === filters.category)?.name;
    const typeName = CONTENT_TYPES.find(type => type.id === filters.contentType)?.name;
    countLabel.replaceChildren(el('strong', {}, `${methods.length}`), ` 篇${filters.saved ? '收藏' : '方法'}${categoryName ? ` · ${categoryName}` : ''}${typeName ? ` · ${typeName}` : ''}${query ? ` · 搜尋「${query}」` : ''}`);
    const hasQuery = Boolean(query || filters.category !== 'all' || filters.topic !== 'all' || filters.contentType !== 'all');
    resetButton.hidden = !hasQuery && filters.sort === 'newest';
    if (!methods.length) { results.replaceChildren(emptyState(hasQuery, clearFilters)); return; }
    const showLatest = !filters.saved && !hasQuery && filters.sort === 'newest';
    const groups = splitMethods(methods, { showLatest });
    let cardIndex = 0;
    function group(key, title, description) {
      if (!groups[key].length) return null;
      return el('section', { class: `library-group ${key}-group`, 'aria-labelledby': `${key}-title`, 'data-library-group': key },
        el('div', { class: 'library-group-heading' }, el('h3', { id: `${key}-title` }, title, el('span', {}, `${groups[key].length} 篇`)), el('p', {}, description)),
        el('div', { class: 'method-grid' }, groups[key].map(method => renderMethodCard(method, cardIndex++, updateResults))));
    }
    results.replaceChildren(...[
      group('pinned', '置頂文章', '站長選定，值得先讀的方法。'),
      group('latest', '最新三篇', groups.pinned.length ? '最新收錄的方法，已置頂文章不重複列出。' : '從最近加入的方法，找一個新的練習。'),
      group('remaining', showLatest ? '更多方法' : filters.saved ? '收藏文章' : '篩選結果', `${sortSelect.selectedOptions[0].textContent}排列${groups.pinned.length ? '，置頂文章另列於上方' : ''}。`),
    ].filter(Boolean));
  }

  const tabs = el('div', { class: 'category-tabs', role: 'group', 'aria-label': '依學習方向篩選' });
  [{ id: 'all', name: '全部方法' }, ...catalog.categories].forEach(category => {
    const count = readyMethods().filter(method => (!filters.saved || favorites.has(method.id)) && (category.id === 'all' || method.categoryId === category.id)).length;
    const categoryCountLabel = el('span', { class: 'category-count', 'aria-label': `${count} 篇` }, count);
    const button = el('button', { type: 'button', class: `category-tab${filters.category === category.id ? ' is-active' : ''}`, 'aria-pressed': String(filters.category === category.id), onClick: () => {
      filters.category = category.id;
      filters.topic = 'all';
      updateCategoryButtons();
      updateTopics();
      updateResults();
      if (!filters.saved) setActiveNav(category.id);
    } }, category.name, categoryCountLabel);
    categoryButtons.push({ button, id: category.id, countLabel: categoryCountLabel });
    tabs.append(button);
  });
  searchInput.addEventListener('input', () => {
    filters.query = searchInput.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(updateResults, 100);
  });
  const search = el('form', { class: 'search-box', role: 'search', onSubmit: event => { event.preventDefault(); filters.query = searchInput.value; clearTimeout(searchTimer); updateResults(); } }, icon('search'), searchInput, clearSearch);
  section.append(el('div', { class: 'library-controls' }, tabs, search), topicArea,
    el('div', { class: 'library-options' },
      el('label', { class: 'library-select', for: 'method-type' }, el('span', {}, '文章種類'), typeSelect),
      el('label', { class: 'library-select', for: 'method-sort' }, el('span', {}, '排序'), sortSelect), resetButton),
    el('div', { class: 'results-toolbar' }, countLabel, el('p', { class: 'results-note' }, filters.saved ? '收藏保留在目前瀏覽器' : '搜尋標題、主題、步驟與心得')), results);
  updateTopics();
  updateResults();
  home.append(section);

  if (!filters.saved) home.append(renderCompanions(), el('section', { class: 'reading-guide', 'aria-labelledby': 'reading-guide-title' },
    el('div', { class: 'guide-intro' }, el('span', { class: 'eyebrow' }, 'A LITTLE PRACTICE, EVERY TIME'), el('h2', { id: 'reading-guide-title' }, '讓每一次閱讀，', el('br'), '多往前走一小步。'), el('p', {}, '清楚的出處、做得到的動作，還有留給自己的練習時間。')),
    el('div', { class: 'guide-items' }, [
      ['01', '知道方法從哪裡來', '原始出處與編輯補充清楚標示，可以回去查、接著讀。'],
      ['02', '知道下一步要做什麼', '每個步驟都有具體動作、示例與完成判準。'],
      ['03', '留下自己的練習軌跡', '收藏方法，勾選進度。下一次回來，從停下來的地方繼續。'],
    ].map(([number, title, text]) => el('article', {}, el('span', { 'aria-hidden': 'true' }, number), el('div', {}, el('h3', {}, title), el('p', {}, text)))))
  ));
  return home;
}

function renderNotFound() {
  return el('section', { class: 'route-error page-width' }, el('span', { class: 'eyebrow' }, '找不到這篇方法'), el('h1', {}, '這篇文章目前不在架上。'), el('p', {}, '文章可能尚未收錄，或連結已更新。回到方法總覽，找一個現在用得上的方法。'), el('a', { class: 'button button-primary', href: '#library' }, icon('back'), '回到方法總覽'));
}

function renderRoute({ focus = true } = {}) {
  if (!catalog) return;
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const methodId = params.get('method');
  let page;
  let title = '方法練習室 — 把看過的方法，變成做得到的步驟';
  if (methodId) {
    const method = readyMethods().find(item => item.id === methodId);
    if (articlePath(method)) { window.location.replace(articlePath(method)); return; }
    page = method ? renderMethod(method, { categories: catalog.categories, isFavorite: id => favorites.has(id), onFavoriteToggle: toggleFavorite }) : renderNotFound();
    title = method ? `${method.title} — 方法練習室` : '找不到這篇方法 — 方法練習室';
    setActiveNav(method?.categoryId);
  } else if (hash === 'preview') {
    page = catalog.demo ? renderMethod(catalog.demo, { preview: true, categories: catalog.categories }) : renderNotFound();
    title = '文章版型示範 — 方法練習室';
    setActiveNav(null);
  } else {
    const category = params.get('category');
    if (category && catalog.categories.some(item => item.id === category)) {
      filters.category = category; filters.topic = 'all'; filters.query = ''; filters.contentType = 'all'; filters.sort = 'newest';
    } else if (hash === '' || hash === 'saved') {
      filters.category = 'all'; filters.topic = 'all'; filters.query = ''; filters.contentType = 'all'; filters.sort = 'newest';
    }
    filters.saved = hash === 'saved';
    page = renderHome();
    setActiveNav(filters.saved ? 'saved' : filters.category);
    if (filters.saved) title = '我的收藏 — 方法練習室';
  }
  clearTimeout(searchTimer);
  main.replaceChildren(page);
  document.title = title;
  if (focus) main.focus({ preventScroll: true });
  requestAnimationFrame(() => {
    if (hash === 'library' || params.has('category')) document.getElementById('library')?.scrollIntoView({ block: 'start' });
    else if (hash === 'companions') document.getElementById('companions')?.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  });
}

async function loadCatalog() {
  main.replaceChildren(el('div', { class: 'loading-state', role: 'status' }, el('span', { class: 'loading-dot' }), '正在打開方法練習室…'));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/data/catalog.json', { signal: controller.signal });
    if (!response.ok) throw new Error(`讀取失敗（${response.status}）`);
    const data = await response.json();
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.methods)) throw new Error('文章資料格式不完整');
    catalog = data;
    updateSavedCount();
    renderRoute({ focus: false });
  } catch (error) {
    main.replaceChildren(el('section', { class: 'route-error page-width', role: 'alert' }, el('span', { class: 'eyebrow' }, '暫時無法開啟文章'), el('h1', {}, '方法筆記還沒順利載入。'), el('p', {}, error.name === 'AbortError' ? '連線比預期久，請檢查網路後再試一次。' : '請檢查網路，稍後再試一次；你的收藏與已儲存的練習進度仍保留在瀏覽器中。'), el('button', { type: 'button', class: 'button button-primary', onClick: loadCatalog }, '重新載入', icon('arrow'))));
  } finally { clearTimeout(timeout); }
}

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView({ block: 'start' });
});
window.addEventListener('hashchange', () => renderRoute());
window.addEventListener('storage', event => {
  if (event.key === FAVORITES_KEY) {
    const value = readStored(FAVORITES_KEY, []);
    favorites = new Set(Array.isArray(value) ? value.filter(id => typeof id === 'string') : []);
    updateSavedCount();
    renderRoute({ focus: false });
  }
});
loadCatalog();
