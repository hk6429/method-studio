import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT_TYPES, selectMethods, splitMethods } from '../public/ui/library.js';

const categories = [
  { id: 'ai', name: '學習 AI', topics: [{ id: 'workflow', name: '工作流程' }, { id: 'chatgpt', name: 'ChatGPT' }] },
  { id: 'english', name: '學習英文', topics: [{ id: 'memory', name: '記憶與複習' }] },
];
const make = (id, patch = {}) => ({
  id, status: 'ready', contentType: 'article_method', title: id,
  categoryId: 'ai', topicIds: ['workflow'], minutes: 15,
  publishedAt: '2026-10-03T10:00:00+08:00', ...patch,
});
const ids = methods => methods.map(method => method.id);

test('類型名稱與既有內容型別對應', () => {
  assert.deepEqual(CONTENT_TYPES, [
    { id: 'video_method', name: '影片方法' },
    { id: 'article_method', name: '主題文章' },
  ]);
});

test('收錄時間優先於資料列順序，按真正時區時間排序且不修改輸入', () => {
  const methods = [
    make('new', { publishedAt: '2026-10-03T09:00:00Z' }),
    make('old', { publishedAt: '2026-10-03T10:00:00+08:00' }),
    make('middle', { publishedAt: '2026-10-03T10:00:00+04:00' }),
  ];
  const before = structuredClone(methods);
  assert.deepEqual(ids(selectMethods(methods, categories)), ['new', 'middle', 'old']);
  assert.deepEqual(ids(selectMethods(methods, categories, { sort: 'oldest' })), ['old', 'middle', 'new']);
  assert.deepEqual(methods, before);
});

test('時間相同時最新排序採後加入資料列優先；最舊排序保持原順序', () => {
  const methods = [make('first'), make('second'), make('third')];
  assert.deepEqual(ids(selectMethods(methods, categories)), ['third', 'second', 'first']);
  assert.deepEqual(ids(selectMethods(methods, categories, { sort: 'oldest' })), ['first', 'second', 'third']);
  assert.deepEqual(ids(selectMethods(methods, categories, { sort: 'shortest' })), ['third', 'second', 'first']);
});

test('最短練習時間同分依最新排序；標題按字母排序', () => {
  const methods = [
    make('long', { title: 'Alpha', minutes: 30 }),
    make('short-old', { title: 'Charlie', minutes: 5 }),
    make('short-new', { title: 'Bravo', minutes: 5, publishedAt: '2026-10-04T10:00:00+08:00' }),
  ];
  assert.deepEqual(ids(selectMethods(methods, categories, { sort: 'shortest' })), ['short-new', 'short-old', 'long']);
  assert.deepEqual(ids(selectMethods(methods, categories, { sort: 'title' })), ['long', 'short-new', 'short-old']);
});

test('舊資料以 reviewedAt 備援；同日仍依資料列決定先後', () => {
  const methods = [
    make('old', { publishedAt: undefined, reviewedAt: '2026-09-01' }),
    make('same-day', { publishedAt: undefined, reviewedAt: '2026-09-01' }),
    make('new', { publishedAt: undefined, reviewedAt: '2026-10-01' }),
  ];
  assert.deepEqual(ids(selectMethods(methods, categories)), ['new', 'same-day', 'old']);
});

test('分類、子題、文章類型、搜尋及收藏採交集，草稿永不進入結果', () => {
  const target = make('target', { title: 'AI 備課', keywords: ['鷹架'], contentType: 'video_method' });
  const methods = [target,
    { ...target, id: 'wrong-category', categoryId: 'english' },
    { ...target, id: 'wrong-topic', topicIds: ['chatgpt'] },
    { ...target, id: 'wrong-type', contentType: 'article_method' },
    { ...target, id: 'wrong-query', keywords: ['練習'] },
    { ...target, id: 'not-saved' },
    { ...target, id: 'draft', status: 'draft' },
  ];
  const filters = { category: 'ai', topic: 'workflow', contentType: 'video_method', query: 'AI 鷹架', saved: true };
  const favorites = new Set(methods.filter(method => method.id !== 'not-saved').map(method => method.id));
  assert.deepEqual(ids(selectMethods(methods, categories, filters, favorites)), ['target']);
  assert.deepEqual(selectMethods(methods, categories, { saved: true }), []);
  assert.ok(!ids(selectMethods(methods, categories)).includes('draft'));
  assert.deepEqual(selectMethods(methods, categories, { category: 'english', topic: 'chatgpt' }), []);
});

test('搜尋正規化全形字與大小寫，多個空白分隔詞可分布在不同教學欄位', () => {
  const method = make('target', { title: 'ＧＰＴ 備課', supplements: [{ title: '延伸', text: '用核對表修訂內容' }] });
  assert.deepEqual(ids(selectMethods([method], categories, { query: '　gpt\n核對表\t主題文章　' })), ['target']);
  assert.deepEqual(ids(selectMethods([method], categories, { query: 'Ｇｐｔ　工作流程' })), ['target']);
  assert.deepEqual(selectMethods([method], categories, { query: 'gpt 不存在' }), []);
  assert.equal(selectMethods([method], categories, { query: ' \n\t ' }).length, 1);
});

test('搜尋涵蓋教學文字與指定分類子題，來源網址與未選子題不混入搜尋', () => {
  const patches = [
    { summary: '測試詞' }, { audience: '測試詞' }, { output: '測試詞' }, { keywords: ['測試詞'] },
    { steps: [{ title: '測試詞' }] }, { steps: [{ action: '測試詞' }] },
    { steps: [{ why: '測試詞' }] }, { steps: [{ example: '測試詞' }] }, { steps: [{ check: '測試詞' }] },
    { practice: { title: '測試詞' } }, { practice: { prompt: '測試詞' } },
    { practice: { deliverable: '測試詞' } }, { practice: { checklist: ['測試詞'] } },
    { pitfalls: ['測試詞'] }, { supplements: [{ title: '測試詞' }] }, { supplements: [{ text: '測試詞' }] },
    { visuals: [{ nodes: [{ detail: '測試詞' }] }] }, { visuals: [{ rows: [{ cells: ['測試詞'] }] }] },
    { sources: [{ title: '測試詞' }] }, { validation: [{ explanation: '測試詞' }] },
    { overview: { alt: '測試詞' } },
  ];
  for (const patch of patches) assert.equal(selectMethods([make('target', patch)], categories, { query: '測試詞' }).length, 1, JSON.stringify(patch));
  const methods = [make('target', { sources: [{ url: 'https://secret-source.example' }] })];
  assert.equal(selectMethods(methods, categories, { query: '學習 AI 工作流程' }).length, 1);
  assert.deepEqual(selectMethods(methods, categories, { query: 'ChatGPT' }), []);
  assert.deepEqual(selectMethods(methods, categories, { query: 'secret-source' }), []);
  assert.equal(selectMethods([make('video', { contentType: 'video_method' })], categories, { query: '影片方法' }).length, 1);
});

test('篩選排序不自行置頂，分組才依置頂順序與原輸入順序整理', () => {
  const methods = [
    make('old-pin', { pinned: true, publishedAt: '2026-09-01T10:00:00+08:00' }),
    make('new', { publishedAt: '2026-10-04T10:00:00+08:00' }),
  ];
  assert.deepEqual(ids(selectMethods(methods, categories)), ['new', 'old-pin']);
  const ordered = [
    make('unordered-a', { pinned: true }), make('second', { pinned: true, pinOrder: 2 }),
    make('first-a', { pinned: true, pinOrder: 1 }), make('first-b', { pinned: true, pinOrder: 1 }),
    make('unordered-b', { pinned: true }), make('ordinary', { pinned: false }),
  ];
  const before = structuredClone(ordered), groups = splitMethods(ordered);
  assert.deepEqual(ids(groups.pinned), ['first-a', 'first-b', 'second', 'unordered-a', 'unordered-b']);
  assert.deepEqual(groups.latest, []);
  assert.deepEqual(ids(groups.remaining), ['ordinary']);
  assert.deepEqual(ordered, before);
});

test('置頂、最新與其餘文章互不重複，最新最多三篇', () => {
  const pinned = make('pin', { pinned: true });
  const methods = [make('pin'), pinned, pinned, make('a'), make('b'), make('a'), make('c'), make('d')];
  const groups = splitMethods(methods, { showLatest: true });
  assert.deepEqual(ids(groups.pinned), ['pin']);
  assert.deepEqual(ids(groups.latest), ['a', 'b', 'c']);
  assert.deepEqual(ids(groups.remaining), ['d']);
  const allIds = Object.values(groups).flat().map(method => method.id);
  assert.equal(new Set(allIds).size, allIds.length);
  for (let count = 0; count <= 3; count++) {
    const small = Array.from({ length: count }, (_, index) => make(`m-${index}`));
    const result = splitMethods(small, { showLatest: true });
    assert.equal(result.latest.length, count);
    assert.deepEqual(result.remaining, []);
  }
});
