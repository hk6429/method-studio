import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function createSiteServer({publicDir=path.join(root,'public'),dataDir=path.join(root,'data')}={}){
  return http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    res.setHeader('Cache-Control','no-store');
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('只支援讀取。');return;}
    try{
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      let file;
      if(pathname==='/data/catalog.json')file=path.join(dataDir,'catalog.json');
      else {
        const relative=pathname==='/'?'index.html':pathname.slice(1);
        file=path.resolve(publicDir,relative);
        if(!file.startsWith(path.resolve(publicDir)+path.sep)||relative.split('/').some(x=>x.startsWith('.'))){res.writeHead(404);res.end('找不到頁面。');return;}
      }
      const data=await fs.readFile(file);
      const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'}[path.extname(file)]||'application/octet-stream';
      res.writeHead(200,{'Content-Type':mime,'Content-Length':data.byteLength});res.end(req.method==='HEAD'?undefined:data);
    }catch(e){const invalid=e instanceof URIError;res.writeHead(invalid?400:404);res.end(invalid?'網址格式不正確。':'找不到頁面。');}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.includes('--help'))console.log('用法：npm run dev -- [--port 8788]\n只在本機 127.0.0.1 提供靜態預覽，無寫入或AI服務。');
  else {
    const portIndex=args.indexOf('--port');const port=portIndex>=0?Number(args[portIndex+1]):8788;
    if(!Number.isInteger(port)||port<1||port>65535)throw new Error('port 必須介於 1–65535');
    const server=createSiteServer();server.listen(port,'127.0.0.1',()=>console.log(`方法練習室：http://127.0.0.1:${port}`));
  }
}
