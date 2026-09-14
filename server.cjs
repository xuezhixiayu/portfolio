const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.mp4':'video/mp4','.webm':'video/webm'};
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Method not allowed');}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400);return res.end('Invalid URL');}
  if(pathname.endsWith('/'))pathname+='index.html';
  const full=path.resolve(root,'.'+pathname);
  if(!full.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  fs.stat(full,(error,stat)=>{
    if(error||!stat.isFile()){res.writeHead(404);return res.end('Not found');}
    const headers={'Content-Type':mime[path.extname(full)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
    let start=0,end=stat.size-1,status=200;
    if(req.headers.range){const match=req.headers.range.match(/^bytes=(\d+)-(\d*)$/);if(!match){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(full,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
  });
});
const port=Number(process.env.PORT||4173);server.listen(port,'127.0.0.1',()=>console.log(`Portfolio preview: http://127.0.0.1:${port}/`));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Open http://127.0.0.1:${port}/ or change PORT.`:error.message);process.exitCode=1;});
