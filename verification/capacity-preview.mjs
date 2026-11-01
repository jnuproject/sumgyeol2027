// Entirely local review server. Does not connect to production or Supabase.
import {createServer} from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';
const {PGlite}=await import(process.env.PGLITE_MODULE??'/tmp/campus-capacity-pg/node_modules/@electric-sql/pglite/dist/index.js');
const db=new PGlite(),root=path.resolve(new URL('../dist/',import.meta.url).pathname);
await db.exec('create role anon;create role authenticated;');await db.exec((await fs.readFile(new URL('../source-data/multiplayer/migrations/campus_walk_nearby.sql',import.meta.url),'utf8')).split('-- Expire even the last session')[0]);
// Optional static crowd fixture, only inside this isolated local database.
const demoCount=Math.min(150,Math.max(0,Number(process.env.CAPACITY_DEMO_COUNT)||0)),demoIds=[];
for(let i=0;i<demoCount;i++){const id=crypto.randomUUID();demoIds.push(id);await db.query('insert into campus_walk_live.sessions(id,secret,scope,seq,x,y,z,yaw,speed) values($1,$2,$3,1,$4,0,$5,3.14159,0)',[id,crypto.randomUUID(),'test-00000000-0000-4000-8000-000000000000',-80+(i%10)*1.7,-475+Math.floor(i/10)*1.8]);}
const renew=demoCount?setInterval(()=>db.query('update campus_walk_live.sessions set seq=seq+1,touched_at=clock_timestamp() where id=any($1::uuid[])',[demoIds]).catch(()=>{}),5000):null;
const mime={'.js':'application/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:18156');res.setHeader('Cache-Control','no-store');
 if(url.pathname==='/multiplayer-config.js'){res.setHeader('Content-Type','application/javascript');res.end("export const multiplayerConfig={url:'http://127.0.0.1:18156/realtime/v1',key:'local-preview',transport:'nearby',scope:'test-00000000-0000-4000-8000-000000000000'};");return;}
 if(url.pathname==='/rest/v1/rpc/campus_walk_sync'&&req.method==='POST'){let body='';for await(const chunk of req){body+=chunk;if(body.length>4096){res.writeHead(413);res.end();return;}}const p=JSON.parse(body).p;const result=await db.transaction(async tx=>{await tx.exec('set local role anon');return await tx.query('select public.campus_walk_sync($1::jsonb) as snapshot',[JSON.stringify(p)]);});res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result.rows[0].snapshot));return;}
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 const filename=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!filename.startsWith(root+'/')){res.writeHead(403);res.end();return;}const data=await fs.readFile(filename);res.setHeader('Content-Type',mime[path.extname(filename)]??'application/octet-stream');res.end(data);
 }catch{res.writeHead(400);res.end('{"error":"local preview request failed"}');}});
server.listen(18156,'127.0.0.1',()=>console.log('Isolated local capacity preview ready on 18156'));
process.on('SIGINT',()=>{if(renew)clearInterval(renew);server.close();db.close().finally(()=>process.exit(0));});
