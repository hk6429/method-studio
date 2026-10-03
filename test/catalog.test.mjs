import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateCatalog} from '../scripts/catalog.mjs';
const initial=JSON.parse(await fs.readFile(new URL('../data/catalog.json',import.meta.url),'utf8'));
function publishedCatalog(){
  const catalog=structuredClone(initial),method=structuredClone(catalog.demo);
  method.overview=structuredClone(initial.methods[0].overview);
  method.id='test-method';method.status='ready';method.contentType='video_method';
  method.publishedAt='2026-10-03T10:00:00+08:00';
  method.sources=[{id:'video',title:'測試來源',kind:'video',videoId:'njhGvYkfPYM',url:'https://www.youtube.com/watch?v=njhGvYkfPYM'}];
  catalog.methods=[method];return catalog;
}
test('正式文章與示範分開；完整合法文章可加入資料',()=>{
  assert.ok(initial.methods.every(method=>method.id!==initial.demo.id && method.status==='ready'));assert.deepEqual(validateCatalog(initial),[]);assert.deepEqual(validateCatalog(publishedCatalog()),[]);
});
test('拒絕沒有原片、引用失聯、憑空時間碼及無來源的成效背書',()=>{
  for(const mutate of [c=>c.methods[0].sources=[],c=>c.methods[0].steps[0].sourceRefs=[{sourceId:'missing',startSeconds:null,endSeconds:null}],c=>c.methods[0].steps[0].sourceRefs=[{sourceId:'video',startSeconds:40,endSeconds:10}],c=>c.methods[0].validation[0].status='supported']){
    const catalog=publishedCatalog();mutate(catalog);assert.ok(validateCatalog(catalog).length>0);
  }
});
test('拒絕不安全來源、壞掉的分類與流程連線',()=>{
  for(const mutate of [c=>c.methods[0].sources[0].url='javascript:alert(1)',c=>c.methods[0].topicIds=['not-a-topic'],c=>c.methods[0].visuals[0].edges[0].to='missing']){
    const catalog=publishedCatalog();mutate(catalog);assert.ok(validateCatalog(catalog).length>0);
  }
});
test('不允許草稿混入公開清單，也不允許重複文章路由',()=>{
  const draft=publishedCatalog();draft.methods[0].status='draft';assert.ok(validateCatalog(draft).length);
  const duplicate=publishedCatalog();duplicate.methods.push(structuredClone(duplicate.methods[0]));assert.ok(validateCatalog(duplicate).length);
});
test('來源影片網址不能與嵌入影片ID不一致',()=>{
  const catalog=publishedCatalog();catalog.methods[0].sources[0].url='https://www.youtube.com/watch?v=aaaaaaaaaaa';
  assert.ok(validateCatalog(catalog).some(error=>error.includes('影片網址與影片 ID')));
});
test('可把程式碼當教學文字保存，前端應以純文字呈現',()=>{
  const catalog=publishedCatalog();catalog.methods[0].steps[0].example='<script>alert("教學範例")</script>';
  assert.deepEqual(validateCatalog(catalog),[]);
});

test('獨立HTML文章只接受受限的站內路徑',()=>{
  const catalog=publishedCatalog();catalog.methods[0].articlePath='/articles/dragon-english-memory.html';assert.deepEqual(validateCatalog(catalog),[]);
  for(const path of ['https://example.com/x','//example.com/x','/articles/../x.html','javascript:alert(1)']){catalog.methods[0].articlePath=path;assert.ok(validateCatalog(catalog).length);}
});

test('文章方法保留原文來源，不冒充影片；影片仍必須有原片',()=>{
  const catalog=publishedCatalog(), method=catalog.methods[0];
  method.contentType='article_method';
  method.sources=[{id:'article',title:'原整理頁',kind:'article',url:'https://example.com/reading'}];
  assert.deepEqual(validateCatalog(catalog),[]);
  method.sources=[];
  assert.ok(validateCatalog(catalog).some(error=>error.includes('原整理頁')));
  method.sources=[{id:'article',title:'原整理頁',kind:'article',url:'https://example.com/reading'}];
  method.contentType='video_method';
  assert.ok(validateCatalog(catalog).some(error=>error.includes('須標明原片')));
  method.contentType='unknown';
  assert.ok(validateCatalog(catalog).some(error=>error.includes('文章類型無效')));
});


test('講者提供稿可無網址，但必須可辨識來源，不能取代影片原片',()=>{
  const catalog=publishedCatalog(), method=catalog.methods[0];
  method.contentType='article_method';
  method.sources=[{id:'notes',kind:'manuscript',title:'研習紀錄',channel:'講者提供',note:'講者貼入整理稿；未核對錄音。'}];
  assert.deepEqual(validateCatalog(catalog),[]);
  const source=method.sources[0];
  source.url='javascript:alert(1)'; assert.ok(validateCatalog(catalog).length); delete source.url;
  delete source.channel; assert.ok(validateCatalog(catalog).length); source.channel='講者提供';
  delete source.note; assert.ok(validateCatalog(catalog).length); source.note='未核對錄音';
  method.contentType='video_method'; assert.ok(validateCatalog(catalog).length);
  method.contentType='article_method'; source.kind='article'; assert.ok(validateCatalog(catalog).length);
});


test('每篇正式文章都必須有桌面、手機與列表配圖，不能漏圖或連外',()=>{
  const missing=publishedCatalog();delete missing.methods[0].overview;
  assert.ok(validateCatalog(missing).some(e=>e.includes('必須提供文章概覽圖')));
  for(const field of ['image','mobileImage','cardImage']){
    for(const bad of [undefined,'javascript:alert(1)','/assets/overviews/../x.svg','https://example.com/image.svg']){
      const c=publishedCatalog();c.methods[0].overview[field]=bad;
      assert.ok(validateCatalog(c).some(e=>e.includes('概覽圖須使用站內')));
    }
  }
});

test('收錄時間必須包含時區，並拒絕不存在的日期與時間',()=>{
  for(const value of [undefined,null,'','2026-10-03','2026-10-03T10:00:00','2026-02-29T10:00:00+08:00','2026-04-31T10:00:00Z','2026-13-01T10:00:00Z','2026-00-01T10:00:00Z','2026-10-00T10:00:00Z','2026-10-03T24:00:00Z','2026-10-03T10:60:00Z','2026-10-03T10:00:60Z','2026-10-03T10:00:00+24:00','2026-10-03T10:00:00+08:60']){
    const catalog=publishedCatalog();catalog.methods[0].publishedAt=value;
    assert.ok(validateCatalog(catalog).some(error=>error.includes('publishedAt')),String(value));
  }
  for(const value of ['2024-02-29T10:00:00Z','2026-10-03T10:00:00.125+08:00','2026-10-03T10:00:00-05:30']){
    const catalog=publishedCatalog();catalog.methods[0].publishedAt=value;
    assert.deepEqual(validateCatalog(catalog),[]);
  }
});

test('置頂與關鍵字欄位需符合明確型別，置頂順序只能給置頂文章',()=>{
  for(const patch of [{pinned:'true'},{pinned:1},{pinned:null},{pinOrder:1},{pinned:false,pinOrder:1},{pinned:true,pinOrder:0},{pinned:true,pinOrder:-1},{pinned:true,pinOrder:1.5},{pinned:true,pinOrder:'1'},{pinned:true,pinOrder:null},{keywords:'練習'},{keywords:null},{keywords:[1]},{keywords:['']} ,{keywords:['   ']}]){
    const catalog=publishedCatalog();Object.assign(catalog.methods[0],patch);
    assert.ok(validateCatalog(catalog).some(error=>/pinned|pinOrder|keywords/.test(error)),JSON.stringify(patch));
  }
  for(const patch of [{pinned:false,keywords:[]},{pinned:true},{pinned:true,pinOrder:2,keywords:['回想','AI']}]){
    const catalog=publishedCatalog();Object.assign(catalog.methods[0],patch);
    assert.deepEqual(validateCatalog(catalog),[]);
  }
  assert.ok(initial.methods.every(method=>!method.pinned),'未指定任何真實文章置頂');
  assert.ok(initial.methods.every(method=>method.keywords?.length),'每篇正式文章都有搜尋關鍵字');
});
