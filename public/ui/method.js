import { el, icon, sourceLink, timecode, safeURL, textBlock, readStored, writeStored, toast } from './dom.js';

const SVG = 'http://www.w3.org/2000/svg';
let diagramSequence = 0;

function svgEl(tag, attrs, text) {
  const node = document.createElementNS(SVG, tag);
  Object.entries(attrs || {}).forEach(([name, value]) => node.setAttribute(name, String(value)));
  if (text !== undefined) node.textContent = text;
  return node;
}

function wrapText(text, length, maxLines) {
  const chars = Array.from(String(text || ''));
  const lines = [];
  for (let at = 0; at < chars.length && lines.length < maxLines; at += length) {
    const clipped = at + length < chars.length && lines.length === maxLines - 1;
    lines.push(chars.slice(at, at + length - (clipped ? 1 : 0)).join('') + (clipped ? '…' : ''));
  }
  return lines;
}

function flowDiagram(visual) {
  const nodes = Array.isArray(visual.nodes) ? visual.nodes : [];
  const edges = Array.isArray(visual.edges) ? visual.edges : [];
  const figure = el('figure', { class: 'visual-figure flow-figure' });
  figure.append(el('figcaption', {}, el('span', { class: 'eyebrow' }, '把方法看清楚'), el('h3', {}, visual.title || '方法流程')));
  if (!nodes.length) return figure;
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const validEdges = edges.filter(edge => nodeMap.has(edge.from) && nodeMap.has(edge.to));
  const indegree = new Map(nodes.map(node => [node.id, 0]));
  const depths = new Map(nodes.map(node => [node.id, 0]));
  validEdges.forEach(edge => indegree.set(edge.to, indegree.get(edge.to) + 1));
  const queue = nodes.filter(node => indegree.get(node.id) === 0).map(node => node.id);
  let processed = 0;
  while (queue.length) {
    const id = queue.shift();
    processed += 1;
    validEdges.filter(edge => edge.from === id).forEach(edge => {
      depths.set(edge.to, Math.max(depths.get(edge.to), depths.get(id) + 1));
      indegree.set(edge.to, indegree.get(edge.to) - 1);
      if (indegree.get(edge.to) === 0) queue.push(edge.to);
    });
  }
  // Cycles are still drawn as actual edges, rather than implying a linear sequence.
  if (processed !== nodes.length) nodes.forEach((node, index) => depths.set(node.id, index));
  const levels = [];
  nodes.forEach(node => {
    const depth = depths.get(node.id);
    (levels[depth] ||= []).push(node);
  });
  const width = Math.max(320, Math.max(...levels.map(level => level?.length || 0)) * 282 + 28);
  const height = levels.length * 160 + 6;
  const positions = new Map();
  levels.forEach((level, depth) => level.forEach((node, index) => {
    positions.set(node.id, { x: (width - level.length * 282) / 2 + index * 282 + 17, y: depth * 160 + 18 });
  }));
  const markerId = `flow-arrow-${++diagramSequence}`;
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': visual.title || '方法流程圖', class: 'flow-svg' });
  const marker = svgEl('marker', { id: markerId, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
  marker.append(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#52776b' }));
  const defs = svgEl('defs');
  defs.append(marker);
  svg.append(defs);
  validEdges.forEach(edge => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    const startX = from.x + 124;
    const endX = to.x + 124;
    const startY = from.y + 106;
    const endY = to.y - 6;
    const midY = (startY + endY) / 2;
    const backward = to.y <= from.y;
    const path = backward
      ? `M ${from.x + 248} ${from.y + 53} C ${width - 3} ${from.y + 53}, ${width - 3} ${to.y + 53}, ${to.x + 250} ${to.y + 53}`
      : `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
    svg.append(svgEl('path', { d: path, fill: 'none', stroke: '#52776b', 'stroke-width': 1.8, 'marker-end': `url(#${markerId})` }));
    if (edge.label) {
      const x = backward ? width - 40 : (startX + endX) / 2;
      const label = svgEl('text', { x, y: midY + 5, 'text-anchor': 'middle', fill: '#52776b', 'font-size': 11, class: 'flow-edge-label' }, edge.label);
      svg.append(label);
    }
  });
  nodes.forEach((node, index) => {
    const { x, y } = positions.get(node.id);
    const group = svgEl('g');
    group.append(svgEl('rect', { x, y, width: 248, height: 106, rx: 4, fill: index === 0 ? '#193732' : '#ffffff', stroke: index === 0 ? '#193732' : '#c7d4cc' }));
    group.append(svgEl('text', { x: x + 16, y: y + 22, fill: index === 0 ? '#bbd4c4' : '#73897d', 'font-size': 11, 'font-weight': 600 }, String(index + 1).padStart(2, '0')));
    wrapText(node.label, 17, 2).forEach((line, lineIndex) => group.append(svgEl('text', { x: x + 16, y: y + 45 + lineIndex * 18, fill: index === 0 ? '#fffef8' : '#193732', 'font-size': 14, 'font-weight': 600 }, line)));
    wrapText(node.detail, 23, 1).forEach(line => group.append(svgEl('text', { x: x + 16, y: y + 86, fill: index === 0 ? '#cbdad1' : '#5c6f65', 'font-size': 11 }, line)));
    svg.append(group);
  });
  const scroll = el('div', { class: 'flow-scroll', tabindex: width > 320 ? '0' : undefined, 'aria-label': '方法流程圖，可左右捲動' }, svg);
  figure.append(scroll);
  figure.append(el('ol', { class: 'flow-transcript' }, nodes.map(node => el('li', {}, el('strong', {}, node.label), node.detail ? `：${node.detail}` : ''))));
  if (validEdges.some(edge => edge.label) || processed !== nodes.length) {
    figure.append(el('div', { class: 'flow-connections' }, validEdges.map(edge => el('p', {}, `${nodeMap.get(edge.from).label} → ${nodeMap.get(edge.to).label}${edge.label ? `（${edge.label}）` : ''}`))));
  }
  figure.append(el('p', { class: 'figure-note' }, visual.note || '這張圖呈現操作順序，不代表已驗證學習成效。'));
  return figure;
}

function scheduleTable(visual) {
  const columns = Array.isArray(visual.columns) ? visual.columns : [];
  const rows = Array.isArray(visual.rows) ? visual.rows : [];
  const table = el('table', { class: 'schedule-table' },
    el('caption', { class: 'sr-only' }, visual.title || '練習排程'),
    el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, '階段'), columns.map(column => el('th', { scope: 'col' }, column)))),
    el('tbody', {}, rows.map(row => el('tr', {}, el('th', { scope: 'row' }, row.label), (row.cells || []).map(cell => el('td', {}, cell)))))
  );
  return el('figure', { class: 'visual-figure schedule-figure' },
    el('figcaption', {}, el('span', { class: 'eyebrow' }, '留一段時間練習'), el('h3', {}, visual.title || '練習排程')),
    el('div', { class: 'table-scroll', tabindex: '0', 'aria-label': '練習排程表，可左右捲動' }, table),
    el('p', { class: 'figure-note' }, visual.note || '排程是練習建議，可依自己的時間調整。')
  );
}

function sectionHeading(number, title, subtitle) {
  return el('div', { class: 'section-heading' }, el('span', { class: 'section-index', 'aria-hidden': 'true' }, number), el('div', {}, el('h2', {}, title), subtitle ? el('p', {}, subtitle) : null));
}

function linkedSources(ids, sources) {
  return el('div', { class: 'reference-links' }, (ids || []).map(id => sources.find(source => source.id === id)).filter(Boolean).map(source => sourceLink(source)));
}

function sourceCard(source, index) {
  const videoId = typeof source.videoId === 'string' && /^[A-Za-z0-9_-]{11}$/.test(source.videoId) ? source.videoId : null;
  const kindNames = { video: '影片來源', official: '官方文件', research: '研究資料', article: '文章來源' };
  const box = el('article', { class: 'source-card' },
    el('span', { class: 'eyebrow' }, `${String(index + 1).padStart(2, '0')} / ${kindNames[source.kind] || '參考來源'}`),
    el('h3', {}, sourceLink(source, source.title)),
    source.channel ? el('p', { class: 'source-channel' }, source.channel) : null,
    source.publishedAt ? el('p', { class: 'source-date' }, `發布日期：${source.publishedAt}`) : null,
    source.note ? textBlock(source.note, 'source-note') : null
  );
  if (source.kind === 'video' && videoId && safeURL(source.url)) {
    const player = el('div', { class: 'video-placeholder' });
    const loadButton = el('button', { class: 'button button-small button-quiet', type: 'button', onClick: () => {
      const iframe = el('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${videoId}`,
        title: source.title || '來源影片',
        loading: 'lazy',
        referrerpolicy: 'strict-origin-when-cross-origin',
        allow: 'encrypted-media; picture-in-picture; fullscreen',
        allowfullscreen: true,
      });
      player.replaceChildren(iframe);
      player.classList.add('video-loaded');
    } }, icon('play'), '在這裡載入影片');
    player.append(loadButton, el('p', {}, '點擊後才會連線至 YouTube。也可以直接開啟原始連結。'));
    box.append(player);
  }
  return box;
}

export function renderMethod(method, options = {}) {
  const { preview = false, categories = [], isFavorite = () => false, onFavoriteToggle = () => {} } = options;
  const steps = Array.isArray(method.steps) ? method.steps : [];
  const sources = Array.isArray(method.sources) ? method.sources : [];
  const visuals = Array.isArray(method.visuals) ? method.visuals : [];
  const validation = Array.isArray(method.validation) ? method.validation : [];
  const supplements = Array.isArray(method.supplements) ? method.supplements : [];
  const category = categories.find(item => item.id === method.categoryId);
  const categoryName = category?.name || (method.categoryId === 'english' ? '學習英文' : '學習 AI');
  const topics = (method.topicIds || []).map(id => category?.topics?.find(topic => topic.id === id)?.name || id);
  const progressKey = `method-studio:progress:v1:${preview ? 'preview:' : ''}${method.id}`;
  const storedProgress = readStored(progressKey, []);
  const validStepIds = new Set(steps.map(step => step.id));
  const completed = new Set((Array.isArray(storedProgress) ? storedProgress : []).filter(id => validStepIds.has(id)));
  const article = el('article', { class: `method-page${preview ? ' is-preview' : ''}` });
  const breadcrumb = el('div', { class: 'breadcrumbs page-width' }, el('a', { href: '#library' }, icon('back'), '回到方法總覽'), el('span', { class: 'breadcrumb-category' }, categoryName));
  article.append(breadcrumb);

  if (preview) article.append(el('aside', { class: 'preview-banner page-width', 'aria-label': '版型示範說明' }, el('strong', {}, '文章版型示範'), el('p', {}, '這是一篇閱讀版型示範，尚未正式收錄。內容用來展示步驟、圖解與練習，並非特定影片的整理或成效證據。')));

  const heading = el('header', { class: 'method-heading page-width' },
    el('div', { class: 'method-kicker' }, el('span', { class: 'eyebrow' }, preview ? 'READING PREVIEW / 文章版型' : `${categoryName} / 方法筆記`), ...topics.map(topic => el('span', { class: 'topic-label' }, topic))),
    el('h1', {}, method.title),
    textBlock(method.summary, 'method-summary'),
    el('div', { class: 'method-meta' },
      method.minutes ? el('span', {}, icon('clock'), `練習約 ${method.minutes} 分鐘`) : null,
      method.level ? el('span', {}, method.level) : null,
      el('span', {}, `${steps.length} 個步驟`),
      !preview && method.reviewedAt ? el('span', {}, `整理日期 ${method.reviewedAt}`) : null
    )
  );
  article.append(heading);
  const layout = el('div', { class: 'method-layout page-width' });
  const content = el('div', { class: 'method-content' });
  const aside = el('aside', { class: 'method-sidebar', 'aria-label': '這次練習' });
  const progressText = el('span', { class: 'progress-text' });
  const progressBar = el('progress', { max: steps.length || 1, value: completed.size, 'aria-label': '步驟完成進度' });
  const progressStatus = el('p', { class: 'progress-status', 'aria-live': 'polite' });
  const completionRows = [];
  const refreshProgress = () => {
    progressText.textContent = `${completed.size} / ${steps.length} 步`;
    progressBar.value = completed.size;
    progressStatus.textContent = completed.size === steps.length && steps.length > 0 ? '步驟都完成了，接著試試實作練習。' : '照自己的步調，一次完成一小步。';
    completionRows.forEach(({ id, checkbox, text, wrapper }) => {
      checkbox.checked = completed.has(id);
      text.textContent = completed.has(id) ? '已完成這一步' : '完成後，勾選這一步';
      wrapper.classList.toggle('step-complete', completed.has(id));
    });
  };

  const outputBox = el('section', { class: 'output-box' }, el('span', { class: 'eyebrow' }, '做完，你會帶走'), el('h2', {}, method.output || '一份自己的練習成果'), method.audience ? el('p', {}, el('strong', {}, '適合誰：'), method.audience) : null);
  content.append(outputBox);

  const stepsSection = el('section', { class: 'reading-section steps-section', id: 'method-steps' }, sectionHeading('01', '跟著步驟做', '每一步都有具體動作；符合完成判準，再繼續下一步。'));
  if (!steps.length) stepsSection.append(el('p', { class: 'muted' }, '這篇文章目前尚未提供操作步驟。'));
  steps.forEach((step, index) => {
    const checkbox = el('input', { type: 'checkbox', checked: completed.has(step.id), 'aria-label': `標記步驟 ${index + 1}：${step.title} 已完成` });
    const completionText = el('span');
    const sourceContribution = step.contribution === 'source';
    const wrapper = el('section', { class: `step-card${completed.has(step.id) ? ' step-complete' : ''}` },
      el('div', { class: 'step-topline' }, el('span', { class: 'step-number' }, `STEP ${String(index + 1).padStart(2, '0')}`), el('span', { class: `contribution-label ${sourceContribution ? 'from-source' : 'from-editor'}` }, sourceContribution ? '來源原述' : '編輯補充')),
      el('h3', {}, step.title),
      textBlock(step.action, 'step-action'),
      step.why ? el('p', { class: 'step-why' }, el('strong', {}, '為什麼這樣做？'), step.why) : null,
      step.example ? el('div', { class: 'step-example' }, el('span', { class: 'small-label' }, '照著試一次'), textBlock(step.example)) : null,
      step.check ? el('div', { class: 'step-check' }, icon('check'), el('p', {}, el('strong', {}, '完成判準'), el('br'), step.check)) : null
    );
    const refs = (step.sourceRefs || []).map(ref => {
      const source = sources.find(item => item.id === ref.sourceId);
      if (!source) return null;
      const hasTime = Number.isFinite(ref.startSeconds) && ref.startSeconds >= 0;
      const segment = hasTime ? `${timecode(ref.startSeconds)}${Number.isFinite(ref.endSeconds) && ref.endSeconds > ref.startSeconds ? `–${timecode(ref.endSeconds)}` : ''}` : null;
      const linkLabel = source.kind === 'video' ? (segment ? `影片 ${segment}` : '觀看完整影片') : source.title;
      return sourceLink(source, linkLabel, hasTime ? ref.startSeconds : null);
    }).filter(Boolean);
    if (refs.length) wrapper.append(el('div', { class: 'step-sources' }, ...refs));
    wrapper.append(el('label', { class: 'step-completion' }, checkbox, completionText));
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) completed.add(step.id); else completed.delete(step.id);
      writeStored(progressKey, [...completed]);
      refreshProgress();
    });
    completionRows.push({ id: step.id, checkbox, text: completionText, wrapper });
    stepsSection.append(wrapper);
  });
  content.append(stepsSection);

  if (visuals.length) content.append(el('section', { class: 'reading-section', id: 'method-visuals' }, sectionHeading('02', '把步驟連起來', '先看整體，再依自己的時間安排練習。'), visuals.map(visual => visual.type === 'flow' ? flowDiagram(visual) : visual.type === 'schedule' ? scheduleTable(visual) : null)));

  if (method.practice) {
    const practice = method.practice;
    const checklistKey = `${progressKey}:practice`;
    const savedChecks = readStored(checklistKey, []);
    const practiceChecks = new Set(Array.isArray(savedChecks) ? savedChecks : []);
    const practiceBox = el('section', { class: 'reading-section practice-section', id: 'method-practice' },
      sectionHeading('03', '輪到你試一次', practice.minutes ? `留 ${practice.minutes} 分鐘，把方法用在自己的情境。` : '把方法用在自己的情境。'),
      el('div', { class: 'practice-paper' }, el('span', { class: 'eyebrow' }, 'YOUR TURN / 實作練習'), el('h3', {}, practice.title), textBlock(practice.prompt, 'practice-prompt'), el('div', { class: 'practice-deliverable' }, el('strong', {}, '這次交給自己的成果'), textBlock(practice.deliverable)), el('fieldset', { class: 'practice-checklist' }, el('legend', {}, '完成前，自己檢查'), (practice.checklist || []).map((item, index) => {
        const input = el('input', { type: 'checkbox', checked: practiceChecks.has(index), onChange: event => {
          if (event.target.checked) practiceChecks.add(index); else practiceChecks.delete(index);
          writeStored(checklistKey, [...practiceChecks]);
        } });
        return el('label', {}, input, el('span', {}, item));
      })))
    );
    content.append(practiceBox);
  }

  if ((method.pitfalls || []).length || supplements.length) content.append(el('section', { class: 'reading-section', id: 'method-notes' }, sectionHeading('04', '練習時，留意這些事'),
    (method.pitfalls || []).length ? el('div', { class: 'pitfalls-box' }, el('h3', {}, '常見誤區與適用限制'), el('ul', {}, method.pitfalls.map(pitfall => el('li', {}, pitfall)))) : null,
    ...supplements.map(supplement => el('article', { class: 'supplement' }, el('span', { class: 'contribution-label from-editor' }, '補充閱讀'), el('h3', {}, supplement.title), textBlock(supplement.text), linkedSources(supplement.sourceIds, sources)))
  ));

  const sourcesSection = el('section', { class: 'reading-section source-section', id: 'method-sources' }, sectionHeading('05', '出處與可信範圍', '分清楚原始說法、編輯補充，以及目前能支持到哪裡。'),
    el('div', { class: 'coverage-note' }, el('strong', {}, '這篇內容如何整理'), textBlock(method.sourceCoverage || '尚未提供取材範圍，請搭配原始來源閱讀。')),
    sources.length ? el('div', { class: 'sources-list' }, sources.map(sourceCard)) : el('p', { class: 'no-source-note' }, preview ? '版型示範沒有對應的原始影片；正式文章會在這裡列出出處。' : '目前未附外部來源，請將本文視為編輯整理。'),
    el('h3', { class: 'validation-heading' }, '佐證與限制'),
    validation.length ? el('div', { class: 'validation-list' }, validation.map(item => {
      const states = { supported: ['有來源支持', 'supported'], partial: ['部分支持', 'partial'], unverified: ['尚未驗證', 'unverified'] };
      const [label, className] = states[item.status] || states.unverified;
      return el('article', { class: 'validation-item' }, el('span', { class: `validation-label ${className}` }, label), el('h4', {}, item.claim), textBlock(item.explanation), linkedSources(item.sourceIds, sources), item.checkedAt ? el('p', { class: 'validation-date' }, `查核日期：${item.checkedAt}`) : null);
    })) : el('p', { class: 'muted' }, '尚未提供外部佐證。流程圖與練習建議本身不代表已證明有效。')
  );
  content.append(sourcesSection);

  const sidebarInner = el('div', { class: 'sidebar-inner' }, el('span', { class: 'eyebrow' }, '我的練習進度'), el('div', { class: 'progress-heading' }, el('strong', {}, '一步一步來'), progressText), progressBar, progressStatus);
  sidebarInner.append(el('p', { class: 'storage-note' }, preview ? '示範進度獨立儲存在目前瀏覽器。' : '進度儲存在目前瀏覽器，可隨時回來接著做。'));
  const actions = el('div', { class: 'sidebar-actions' });
  if (!preview) {
    const saveButton = el('button', { type: 'button', class: 'button button-primary', 'aria-pressed': String(isFavorite(method.id)) });
    const updateSave = () => {
      const saved = isFavorite(method.id);
      saveButton.setAttribute('aria-pressed', String(saved));
      saveButton.replaceChildren(icon('bookmark'), saved ? '已收藏這個方法' : '收藏這個方法');
    };
    saveButton.addEventListener('click', () => { onFavoriteToggle(method.id); updateSave(); });
    updateSave();
    actions.append(saveButton);
  }
  actions.append(el('button', { type: 'button', class: 'button button-quiet', onClick: () => window.print() }, icon('print'), '列印練習筆記'));
  sidebarInner.append(actions);
  const contents = [{ id: 'method-steps', label: '跟著步驟做', show: true }, { id: 'method-visuals', label: '流程與排程', show: visuals.length }, { id: 'method-practice', label: '實作練習', show: method.practice }, { id: 'method-notes', label: '誤區與提醒', show: (method.pitfalls || []).length || supplements.length }, { id: 'method-sources', label: '出處與可信範圍', show: true }];
  sidebarInner.append(el('nav', { class: 'article-toc', 'aria-label': '文章目錄' }, el('p', { class: 'small-label' }, '這篇文章'), contents.filter(item => item.show).map((item, index) => el('button', { type: 'button', onClick: () => {
    const target = article.querySelector(`#${item.id}`);
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    target?.setAttribute('tabindex', '-1');
    target?.focus({ preventScroll: true });
  } }, el('span', { 'aria-hidden': 'true' }, String(index + 1).padStart(2, '0')), item.label))));
  if (steps.length) sidebarInner.append(el('button', { type: 'button', class: 'reset-progress', onClick: () => {
    completed.clear();
    writeStored(progressKey, []);
    refreshProgress();
    toast('步驟進度已清除，可以再練習一次。');
  } }, '重新開始這個方法'));
  aside.append(sidebarInner);
  refreshProgress();
  layout.append(content, aside);
  article.append(layout, el('div', { class: 'article-ending page-width' }, el('p', {}, '知道一個方法，是起點。親手做一次，才開始變成自己的。'), el('a', { class: 'button button-quiet', href: '#library' }, icon('back'), '回到方法總覽')));
  return article;
}
