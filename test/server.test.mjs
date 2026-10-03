import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {createSiteServer} from '../scripts/serve.mjs';
test('本機只提供公開檔案與catalog，不洩露docs或接受寫入',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'method-studio-test-'));
  await fs.mkdir(path.join(root,'public'));await fs.mkdir(path.join(root,'data'));
  await fs.writeFile(path.join(root,'public/index.html'),'<p>靜態頁</p>');await fs.writeFile(path.join(root,'data/catalog.json'),'{}');await fs.writeFile(path.join(root,'private.txt'),'private');
  const server=createSiteServer({publicDir:path.join(root,'public'),dataDir:path.join(root,'data')});server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await fetch(base)).status,200);assert.match((await fetch(base+'/data/catalog.json')).headers.get('content-type'),/application\/json/);
    for(const route of ['/private.txt','/..%2fprivate.txt','/docs/BRIEF.md','/.env'])assert.equal((await fetch(base+route)).status,404);
    assert.equal((await fetch(base+'/data/catalog.json',{method:'POST',body:'overwrite'})).status,405);
    assert.equal(await fs.readFile(path.join(root,'data/catalog.json'),'utf8'),'{}');
  }finally{await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
