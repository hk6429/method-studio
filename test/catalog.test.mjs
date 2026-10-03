import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateCatalog} from '../scripts/catalog.mjs';
const initial=JSON.parse(await fs.readFile(new URL('../data/catalog.json',import.meta.url),'utf8'));
function publishedCatalog(){
  const catalog=structuredClone(initial),method=structuredClone(catalog.demo);
  method.id='test-method';method.status='ready';method.contentType='video_method';
  method.sources=[{id:'video',title:'測試來源',kind:'video',videoId:'njhGvYkfPYM',url:'https://www.youtube.com/watch?v=njhGvYkfPYM'}];
  catalog.methods=[method];return catalog;
}
test('初版不把示範冒充正式文章；完整合法文章可加入資料',()=>{
  assert.equal(initial.methods.length,0);assert.deepEqual(validateCatalog(initial),[]);assert.deepEqual(validateCatalog(publishedCatalog()),[]);
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
