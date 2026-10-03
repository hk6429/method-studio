export const CONTENT_TYPES = [
  { id: 'video_method', name: '影片方法' },
  { id: 'article_method', name: '主題文章' },
];

const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('zh-Hant-TW');
const list = value => Array.isArray(value) ? value : [];
const fields = (items, names) => list(items).flatMap(item => names.map(name => item?.[name]));

function searchableText(method, categories) {
  const category = categories.find(item => item.id === method.categoryId);
  const topics = list(method.topicIds).map(id => category?.topics?.find(topic => topic.id === id));
  const practice = method.practice || {};
  return normalize([
    method.title, method.summary, method.output, method.audience, method.level,
    method.coverLabel, method.sourceCoverage, category?.name, category?.description,
    ...fields(topics, ['name']), ...list(method.keywords),
    CONTENT_TYPES.find(type => type.id === method.contentType)?.name,
    method.overview?.alt, method.overview?.caption,
    ...fields(method.steps, ['title', 'action', 'why', 'example', 'check']),
    practice.title, practice.prompt, practice.deliverable, ...list(practice.checklist),
    ...list(method.pitfalls), ...fields(method.supplements, ['title', 'text']),
    ...fields(method.sources, ['title', 'channel', 'note']),
    ...fields(method.validation, ['claim', 'explanation']),
    ...list(method.visuals).flatMap(visual => [
      visual.title, visual.note, ...list(visual.columns),
      ...fields(visual.nodes, ['label', 'detail']), ...fields(visual.edges, ['label']),
      ...list(visual.rows).flatMap(row => [row.label, ...list(row.cells)]),
    ]),
  ].filter(value => typeof value === 'string').join(' '));
}

function publishedTime(method) {
  const time = Date.parse(method.publishedAt || method.reviewedAt || '');
  return Number.isFinite(time) ? time : -Infinity;
}

export function selectMethods(methods, categories, filters = {}, favorites = new Set()) {
  const {
    category = 'all', topic = 'all', contentType = 'all', query = '',
    saved = false, sort = 'newest',
  } = filters;
  const terms = normalize(query).trim().split(/\s+/u).filter(Boolean);
  const selected = methods.map((method, index) => ({ method, index, time: publishedTime(method) }))
    .filter(({ method }) => {
      if (method.status !== 'ready') return false;
      if (category !== 'all' && method.categoryId !== category) return false;
      if (topic !== 'all' && !list(method.topicIds).includes(topic)) return false;
      if (contentType !== 'all' && method.contentType !== contentType) return false;
      if (saved && !favorites.has(method.id)) return false;
      if (!terms.length) return true;
      const searchable = searchableText(method, categories);
      return terms.every(term => searchable.includes(term));
    });
  const newest = (a, b) => b.time - a.time || b.index - a.index;
  const comparators = {
    newest,
    oldest: (a, b) => a.time - b.time || a.index - b.index,
    shortest: (a, b) => a.method.minutes - b.method.minutes || newest(a, b),
    title: (a, b) => a.method.title.localeCompare(b.method.title, 'zh-Hant-TW') || newest(a, b),
  };
  return selected.sort(comparators[sort] || newest).map(({ method }) => method);
}

export function splitMethods(methods, { showLatest = false } = {}) {
  const pinnedIds = new Set();
  const pinned = methods.map((method, index) => ({ method, index }))
    .filter(({ method }) => {
      if (method.pinned !== true || pinnedIds.has(method.id)) return false;
      pinnedIds.add(method.id);
      return true;
    })
    .sort((a, b) => (a.method.pinOrder ?? Infinity) - (b.method.pinOrder ?? Infinity) || a.index - b.index)
    .map(({ method }) => method);
  const seen = new Set(pinnedIds);
  const unpinned = methods.filter(method => {
    if (seen.has(method.id)) return false;
    seen.add(method.id);
    return true;
  });
  return {
    pinned,
    latest: showLatest ? unpinned.slice(0, 3) : [],
    remaining: showLatest ? unpinned.slice(3) : unpinned,
  };
}
