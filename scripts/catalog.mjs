export const isHttpsUrl = value => {
  try { const u = new URL(value); return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password; } catch { return false; }
};
const slug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const list = value => Array.isArray(value) ? value : [];
export function validateCatalog(catalog) {
  const errors = [];
  const error = (path, message) => errors.push(`${path}：${message}`);
  if (catalog?.schemaVersion !== 1) error('schemaVersion', '必須是 1');
  if (!text(catalog?.site?.name) || !text(catalog?.site?.tagline)) error('site', '缺少站名或介紹');
  const categories = list(catalog?.categories), categoryIds = new Set();
  for (const category of categories) {
    if (!slug(category.id) || categoryIds.has(category.id)) error('categories', '分類 ID 無效或重複');
    categoryIds.add(category.id);
    const ids = new Set();
    for (const topic of list(category.topics)) {
      if (!slug(topic.id) || ids.has(topic.id) || !text(topic.name)) error(category.id, '子題無效或重複');
      ids.add(topic.id);
    }
  }
  if (!categoryIds.has('ai') || !categoryIds.has('english')) error('categories', '須保留學習 AI 與學習英文');
  if (!Array.isArray(catalog?.methods)) error('methods', '必須是陣列');
  const publishedIds = new Set();
  for (const [index, method] of list(catalog?.methods).entries()) {
    const path = `methods[${index}]`;
    if (!method || typeof method !== 'object') { error(path, '文章格式錯誤'); continue; }
    if (publishedIds.has(method.id)) error(path, '文章 ID 重複');
    publishedIds.add(method.id);
    if (method.status !== 'ready') error(path, '公開清單不得包含未定稿文章');
    if (method.contentType === 'editorial_example') error(path, '版型示範不得混入正式文章');
    validateMethod(method, path, false);
  }
  if (!catalog?.demo) error('demo', '缺少獨立文章版型');
  else {
    if (publishedIds.has(catalog.demo.id)) error('demo', '示範與正式文章 ID 不可相同');
    if (catalog.demo.status !== 'draft' || catalog.demo.contentType !== 'editorial_example') error('demo', '示範必須保持草稿與示範標記');
    validateMethod(catalog.demo, 'demo', true);
  }
  function validateMethod(method, path, demo) {
    if (!method || typeof method !== 'object') { error(path, '文章格式錯誤'); return; }
    if (!slug(method.id)) error(path, '文章 ID 必須是英文小寫 slug');
    if (!['video_method','article_method','editorial_example'].includes(method.contentType)) error(path, '文章類型無效');
    if (method.articlePath != null && (typeof method.articlePath !== 'string' || !/^\/articles\/[a-z0-9-]+\.html$/.test(method.articlePath))) error(path, '獨立文章路徑須為 /articles/slug.html');
    for (const field of ['title','summary','output','audience','sourceCoverage']) if (!text(method[field])) error(`${path}.${field}`, '必填');
    if (!Number.isFinite(method.minutes) || method.minutes <= 0) error(path, '練習時間須大於 0');
    const category = categories.find(c => c.id === method.categoryId);
    if (!category) error(path, '分類不存在');
    if (!Array.isArray(method.topicIds) || !method.topicIds.length || method.topicIds.some(t => !category?.topics?.some(topic => topic.id === t))) error(path, '子題必須屬於文章分類');
    const sources = list(method.sources), sourceIds = new Set();
    for (const source of sources) {
      if (!slug(source.id) || sourceIds.has(source.id)) error(path, '來源 ID 無效或重複');
      sourceIds.add(source.id);
      if (!text(source.title) || !isHttpsUrl(source.url)) error(path, '來源須有標題及安全的 https 網址');
      if (!['video','article','official','research'].includes(source.kind)) error(path, '來源類型無效');
      if (source.kind === 'video' && (!/^[\w-]{11}$/.test(source.videoId || '') || !isHttpsUrl(source.url) || !['youtube.com','www.youtube.com','youtu.be'].includes(new URL(source.url).hostname))) error(path, '影片來源須有有效 YouTube ID 與網址');
      if (source.kind === 'video' && isHttpsUrl(source.url)) {
        const url = new URL(source.url);
        const linkedId = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || (/^\/(?:shorts|embed)\/([\w-]{11})$/.exec(url.pathname)?.[1]);
        if (linkedId !== source.videoId) error(path, '影片網址與影片 ID 不一致');
      }
    }
    if (!demo && method.contentType === 'video_method' && !sources.some(s => s.kind === 'video')) error(path, '正式影片方法須標明原片');
    if (!demo && method.contentType === 'article_method' && !sources.some(s => s.kind === 'article')) error(path, '正式文章方法須標明原整理頁');
    const steps = list(method.steps), stepIds = new Set();
    if (steps.length < 2) error(path, '至少需要兩個可執行步驟');
    for (const step of steps) {
      if (!slug(step.id) || stepIds.has(step.id)) error(path, '步驟 ID 無效或重複');
      stepIds.add(step.id);
      for (const field of ['title','action','example','check']) if (!text(step[field])) error(`${path}.${step.id}`, `缺少 ${field}`);
      if (!['source','editorial'].includes(step.contribution)) error(path, '步驟須區分來源與編輯補充');
      if (step.contribution === 'source' && !list(step.sourceRefs).length) error(path, '來源步驟須引用來源');
      for (const ref of list(step.sourceRefs)) {
        if (!sourceIds.has(ref.sourceId)) error(path, '步驟引用不存在的來源');
        for (const key of ['startSeconds','endSeconds']) if (ref[key] != null && (!Number.isFinite(ref[key]) || ref[key] < 0)) error(path, '時間點必須是非負秒數或 null');
        if (ref.endSeconds != null && (ref.startSeconds == null || ref.endSeconds < ref.startSeconds)) error(path, '時間點結束不得早於開始');
      }
    }
    for (const visual of list(method.visuals)) {
      if (visual.type === 'flow') {
        const nodes = list(visual.nodes), ids = new Set(nodes.map(n => n.id));
        if (!nodes.length || nodes.length !== ids.size) error(path, '流程節點不可空白或重複');
        if (list(visual.edges).some(e => !ids.has(e.from) || !ids.has(e.to))) error(path, '流程連線指向不存在的節點');
      } else if (visual.type === 'schedule') {
        if (!list(visual.columns).length || list(visual.rows).some(r => !Array.isArray(r.cells) || r.cells.length !== visual.columns.length)) error(path, '排程欄位數不一致');
      } else error(path, '圖解類型無效');
    }
    for (const validation of list(method.validation)) {
      if (!['supported','partial','unverified'].includes(validation.status)) error(path, '查證狀態無效');
      if (validation.status !== 'unverified' && !list(validation.sourceIds).length) error(path, '宣稱有佐證必須提供來源');
      if (list(validation.sourceIds).some(id => !sourceIds.has(id))) error(path, '查證引用不存在的來源');
    }
    if (!text(method.practice?.prompt) || !text(method.practice?.deliverable) || !list(method.practice?.checklist).length) error(path, '缺少具體練習與完成判準');
  }
  return errors;
}
