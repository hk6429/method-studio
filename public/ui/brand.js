import { el } from './dom.js';

export const characters = [
  { id: 'zhixing', name: '知行', role: '帶你動手', description: '先做一小步，留下看得見的成果。' },
  { id: 'yicheng', name: '以澄', role: '拆解方法', description: '把複雜的事，拆成做得到的步驟。' },
  { id: 'awen', name: '阿問', role: '一起提問', description: '遇到卡點，換個角度再問一次。' },
  { id: 'xiaoyan', name: '小硯', role: '回看出處', description: '分清來源與補充，讓理解有依據。' },
  { id: 'mowan', name: '墨丸', role: '陪你練習', description: '今天先練這一個，也很好。' },
];

export function characterImage(id, { size = 96, className = '', eager = false } = {}) {
  return el('img', {
    class: `character-portrait ${className}`.trim(),
    src: `/assets/brand/${id}.webp`, alt: '', width: size, height: size,
    loading: eager ? 'eager' : 'lazy', decoding: 'async',
  });
}

export function characterCue(id, text, { className = '', compact = false } = {}) {
  const character = characters.find(item => item.id === id);
  if (!character) return null;
  return el('aside', { class: `character-cue${compact ? ' is-compact' : ''} ${className}`.trim() },
    characterImage(id),
    el('div', {}, el('strong', {}, `${character.name} · ${character.role}`), el('p', {}, text)));
}

export function renderCompanions() {
  return el('section', { class: 'companions page-width', 'aria-labelledby': 'companions-title' },
    el('div', { class: 'companions-heading' }, el('span', { class: 'eyebrow' }, '同路的學習夥伴'), el('h2', { id: 'companions-title' }, '有人提問，有人陪你試。'), el('p', {}, '四位書院夥伴，加上臺灣犬墨丸。陪你找方法，也陪你慢慢練。')),
    el('div', { class: 'companion-grid' }, characters.map(character => el('article', { class: 'companion', 'data-character': character.id },
      characterImage(character.id, { size: 144 }),
      el('h3', {}, character.name), el('span', { class: 'companion-role' }, character.role), el('p', {}, character.description)))));
}
