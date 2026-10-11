import fs from 'node:fs';import path from 'node:path';
const [,,outDir,repo]=process.argv;const cat=path.join(repo,'data/catalog.json');
const c=JSON.parse(fs.readFileSync(cat,'utf8'));const ids=new Set(c.methods.map(m=>m.id));
const files=fs.readdirSync(outDir).filter(f=>f.endsWith('.json')).sort();let n=0;
const base=new Date();
for(const f of files){const m=JSON.parse(fs.readFileSync(path.join(outDir,f),'utf8'));
  if(ids.has(m.id)){console.log('skip existing',m.id);continue;}
  const t=new Date(base.getTime()+n*1000);const pad=x=>String(x).padStart(2,'0');
  m.publishedAt=`${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}+08:00`;
  for(const suf of ['','-mobile','-card']){const src=path.join(outDir,`${m.id}${suf}.svg`);if(!fs.existsSync(src))throw new Error('missing svg '+src);
    fs.copyFileSync(src,path.join(repo,'public/assets/overviews',`${m.id}${suf}.svg`));}
  c.methods.push(m);ids.add(m.id);n++;console.log('added',m.id,m.publishedAt);}
fs.writeFileSync(cat,JSON.stringify(c,null,2)+'\n');console.log('total methods',c.methods.length);
