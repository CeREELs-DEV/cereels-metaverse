import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import express from 'express';
import compression from 'compression';
import {Server,matchMaker,createRouter} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {SeoulRoom,MAX_VISITORS} from './room.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
export async function startServer({port=Number(process.env.PORT)||2567,host='0.0.0.0',publicDir=path.join(root,existsSync(path.join(root,'public'))?'public':'../dist'),world,traffic,signals=true}={}){
 world??=JSON.parse(readFileSync(path.join(root,'world-data.json'),'utf8'));
 traffic??=existsSync(path.join(root,'traffic-data.json'))?JSON.parse(readFileSync(path.join(root,'traffic-data.json'),'utf8')):undefined;
 const httpLimits=new Map();
 const server=new Server({greet:false,gracefullyShutdown:signals,transport:new WebSocketTransport({maxPayload:4096,pingInterval:15000,pingMaxRetries:2}),express:app=>{
  app.disable('x-powered-by');app.set('trust proxy',1);
  app.use((req,res,next)=>{
   res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
   next();
  });
  app.use(compression());
  app.get('/healthz',(_req,res)=>res.json({ok:true,world:'seoul',worldId:world.worldId||'seoul',mapRevision:world.mapRevision||'stable-1.1',capacity:MAX_VISITORS,traffic:traffic?'shared-v1':'disabled',build:process.env.RENDER_GIT_COMMIT?.slice(0,12)||'local'}));
  app.use(express.static(publicDir,{maxAge:'1h',dotfiles:'deny',setHeaders:(res,file)=>{if(file.endsWith('.html'))res.setHeader('Cache-Control','no-cache');}}));
 }});
 server.router=createRouter({},{onRequest:request=>{
  if(!new URL(request.url).pathname.startsWith('/matchmake/'))return;
  if(Number(request.headers.get('content-length'))>4096)return Response.json({error:'요청이 너무 큽니다.'},{status:413});
  const now=Date.now(),key=request.headers.get('x-forwarded-for')?.split(',').at(-1).trim()||'local',entry=httpLimits.get(key);
  if(entry&&entry.until>now){if(++entry.count>30)return Response.json({error:'잠시 뒤 다시 접속해 주세요.'},{status:429});}
  else{if(httpLimits.size>=10000){for(const [ip,value] of httpLimits)if(value.until<now)httpLimits.delete(ip);if(httpLimits.size>=10000)return new Response(null,{status:503});}httpLimits.set(key,{count:1,until:now+60000});}
 }});
 server.define('seoul',SeoulRoom,{world,traffic});
 await server.listen(port,host);await matchMaker.createRoom('seoul',{});
 return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 startServer().then(()=>console.log('CeREELs Seoul server ready')).catch(error=>{console.error(error);process.exitCode=1;});
}
