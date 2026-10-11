// 用法：node compress-transcript.mjs <逐字稿.txt> <輸出digest.md>
// 把 "[mm:ss] 文字" 逐字稿切成約 2500 字一段，每段交給 haiku 摘要，輸出帶真實起訖時間的濃縮稿。
// 短稿（<6000 字）不壓縮，直接複製。原稿保留，供撰稿代理 grep 原話與核對秒數。
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const [,, src, out] = process.argv;
const lines = fs.readFileSync(src, 'utf8').split('\n').filter(l => /^\[\d+:\d{2}\]/.test(l));
const total = lines.join('').length;
if (total < 6000) { fs.copyFileSync(src, out); console.log(`short ${total} 字，不壓縮`); process.exit(0); }
const chunks = []; let cur = [], len = 0;
for (const l of lines) { cur.push(l); len += l.length; if (len >= 2500) { chunks.push(cur); cur = []; len = 0; } }
if (cur.length) chunks.push(cur);
const ts = l => l.match(/^\[(\d+:\d{2})\]/)[1];
const PROMPT = '以下是影片逐字稿的一段。用繁體中文（台灣用語）濃縮成 120 字內的要點：只留「問題／主張／具體做法／例子／數字」，不要評論。直接輸出要點，不要前言。\n\n';
const run = c => new Promise(res => {
  const p = spawn('claude', ['-p', PROMPT + c.join('\n'), '--model', 'haiku', '--tools', '', '--no-session-persistence', '--max-turns', '2'], { stdio: ['ignore', 'pipe', 'ignore'] });
  let o = ''; p.stdout.on('data', d => o += d);
  const t = setTimeout(() => p.kill(), 90000);
  p.on('close', () => { clearTimeout(t); res(o.trim()); });
});
const results = new Array(chunks.length); let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < chunks.length) { const i = next++; results[i] = await run(chunks[i]); }
}));
const body = chunks.map((c, i) => `## [${ts(c[0])}–${ts(c.at(-1))}]\n${results[i] || '（摘要失敗，需 grep 原稿）'}`).join('\n\n');
fs.writeFileSync(out, body + '\n');
console.log(`壓縮 ${total} 字 → ${body.length} 字（${chunks.length} 段）`);
