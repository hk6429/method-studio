import fs from 'node:fs';import path from 'node:path';
import {validateCatalog} from '../scripts/catalog.mjs';
export function mergeBatch(outDir,repo){
  const cat=path.join(repo,'data/catalog.json');const original=fs.readFileSync(cat,'utf8');
  const c=JSON.parse(original);const ids=new Set(c.methods.map(m=>m.id));
  const urls=new Set(c.methods.flatMap(m=>m.sources.map(s=>s.url).filter(Boolean)));
  const videos=new Set(c.methods.flatMap(m=>m.sources.map(s=>s.videoId).filter(Boolean)));
  const files=fs.readdirSync(outDir).filter(f=>f.endsWith('.json')).sort();
  const items=files.map(f=>JSON.parse(fs.readFileSync(path.join(outDir,f),'utf8')));
  if(items.length!==20)throw new Error(`整批發布需要 20 篇，目前 ${items.length} 篇；保留草稿，不合併。`);
  const assets=[];const base=Date.now();
  for(const [n,m] of items.entries()){
    if(ids.has(m.id))throw new Error('重複文章 ID：'+m.id);ids.add(m.id);
    for(const s of m.sources){
      if((s.url&&urls.has(s.url))||(s.videoId&&videos.has(s.videoId)))throw new Error('已使用的來源：'+m.id);
    }
    for(const s of m.sources){if(s.url)urls.add(s.url);if(s.videoId)videos.add(s.videoId);}
    m.publishedAt=new Date(base+n*1000).toISOString();
    for(const suf of ['','-mobile','-card']){
      const name=`${m.id}${suf}.svg`;const src=path.join(outDir,name);const dest=path.join(repo,'public/assets/overviews',name);
      if(!fs.existsSync(src))throw new Error('缺少圖解：'+src);
      if(fs.existsSync(dest))throw new Error('目標圖解已存在，請先確認：'+dest);
      assets.push({dest,data:fs.readFileSync(src)});
    }
  }
  c.methods.push(...items);const errors=validateCatalog(c);if(errors.length)throw new Error(errors.join('\n'));
  if(fs.readFileSync(cat,'utf8')!==original)throw new Error('文章清單已變動，請重新去重與檢查。');
  for(const asset of assets)fs.writeFileSync(asset.dest,asset.data,{flag:'wx'});
  fs.writeFileSync(cat,JSON.stringify(c,null,2)+'\n');
  console.log('已合併 20 篇；總篇數',c.methods.length);return c;
}
if(process.argv[1]&&path.resolve(process.argv[1])===new URL(import.meta.url).pathname){
  const [,,outDir,repo]=process.argv;if(!outDir||!repo)throw new Error('用法：node automation/merge.mjs <outDir> <repo>');mergeBatch(outDir,repo);
}
