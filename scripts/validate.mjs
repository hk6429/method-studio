import fs from 'node:fs/promises';
import {validateCatalog} from './catalog.mjs';
const path = new URL('../data/catalog.json', import.meta.url);
try {
  const catalog = JSON.parse(await fs.readFile(path,'utf8'));
  const errors = validateCatalog(catalog);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
  else console.log(`資料通過：${catalog.categories.length} 大類、${catalog.methods.length} 篇正式文章、1 份獨立版型示範。`);
} catch (e) { console.error(e.message); process.exitCode=1; }
