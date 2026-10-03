import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateCatalog} from './catalog.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(await fs.readFile(path.join(root,'data/catalog.json'),'utf8'));
const errors=validateCatalog(catalog);if(errors.length)throw new Error(errors.join('\n'));
for(const name of ['index.html','styles.css','app.js'])await fs.access(path.join(root,'public',name));
for(const method of catalog.methods)if(method.articlePath){
  const article=path.join(root,'public',method.articlePath.slice(1));
  if(!(await fs.stat(article)).isFile())throw new Error(`找不到文章檔案：${method.articlePath}`);
}
const temporary=await fs.mkdtemp(path.join(root,'.build-'));
for(const method of catalog.methods)if(method.overview){
  for(const field of ['image','mobileImage'])await fs.access(path.join(root,'public',method.overview[field].slice(1)));
}
try {
  await fs.cp(path.join(root,'public'),temporary,{recursive:true,filter:source=>!source.endsWith('.DS_Store')});
  await fs.mkdir(path.join(temporary,'data'),{recursive:true});
  await fs.writeFile(path.join(temporary,'data/catalog.json'),JSON.stringify(catalog,null,2)+'\n');
  await fs.rm(path.join(root,'dist'),{recursive:true,force:true});
  await fs.rename(temporary,path.join(root,'dist'));
  console.log('已產生 dist/：僅包含靜態網站與文章資料。');
} catch(e) {await fs.rm(temporary,{recursive:true,force:true});throw e;}
