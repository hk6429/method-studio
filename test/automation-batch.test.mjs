import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {mergeBatch} from '../automation/merge.mjs';
const baseline=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
function fixture(t,n=20){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'method-batch-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const out=path.join(root,'out'),repo=path.join(root,'repo');fs.mkdirSync(out);fs.mkdirSync(path.join(repo,'data'),{recursive:true});fs.mkdirSync(path.join(repo,'public/assets/overviews'),{recursive:true});
 const raw=JSON.stringify(baseline);fs.writeFileSync(path.join(repo,'data/catalog.json'),raw);
 const seed=baseline.methods.find(m=>m.contentType==='video_method'&&!m.articlePath);
 for(let i=0;i<n;i++){let m=structuredClone(seed);m.id='batch-test-'+i;const v=('test'+String(i).padStart(7,'0'));for(const s of m.sources){if(s.kind==='video'){s.videoId=v;s.url='https://www.youtube.com/watch?v='+v;}else s.url='https://example.com/source/'+i+'/'+s.id;}
  m.overview.image=`/assets/overviews/${m.id}.svg`;m.overview.mobileImage=`/assets/overviews/${m.id}-mobile.svg`;m.overview.cardImage=`/assets/overviews/${m.id}-card.svg`;
  fs.writeFileSync(path.join(out,m.id+'.json'),JSON.stringify(m));for(const suffix of ['','-mobile','-card'])fs.writeFileSync(path.join(out,m.id+suffix+'.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');}
 return {root,out,repo,raw};
}
function unchanged(f){assert.equal(fs.readFileSync(path.join(f.repo,'data/catalog.json'),'utf8'),f.raw);assert.equal(fs.readdirSync(path.join(f.repo,'public/assets/overviews')).length,0);}
test('19 或 21 篇都不能部分合併，原清單與圖解維持原樣',t=>{for(const n of [19,21]){const f=fixture(t,n);assert.throws(()=>mergeBatch(f.out,f.repo),/需要 20 篇/);unchanged(f);}});
test('完整20篇才合併，保留既有內容並複製60張圖解',t=>{const f=fixture(t);const c=mergeBatch(f.out,f.repo);assert.deepEqual(c.methods.slice(0,baseline.methods.length),baseline.methods);assert.equal(c.methods.length,baseline.methods.length+20);assert.equal(fs.readdirSync(path.join(f.repo,'public/assets/overviews')).length,60);});
test('同來源、缺圖與不合法文章在寫入前整批拒絕',t=>{for(const kind of ['source','asset','schema']){const f=fixture(t);const p=path.join(f.out,'batch-test-19.json');const m=JSON.parse(fs.readFileSync(p));if(kind==='source'){const other=JSON.parse(fs.readFileSync(path.join(f.out,'batch-test-0.json')));m.sources=other.sources;}if(kind==='schema')m.topicIds=['not-valid'];fs.writeFileSync(p,JSON.stringify(m));if(kind==='asset')fs.unlinkSync(path.join(f.out,'batch-test-19-mobile.svg'));assert.throws(()=>mergeBatch(f.out,f.repo));unchanged(f);}});
